import cv2
import numpy as np
import os

def render_scene1(output_dir="public/assets/frames", total_frames=78):
    os.makedirs(output_dir, exist_ok=True)
    
    # Load base high-res entrance render
    entrance_img = cv2.imread("public/assets/3d-renders/entrance_3d_mobile.jpg")
    h_img, w_img, _ = entrance_img.shape
    out_w, out_h = 720, 1280
    
    # Precise door measurements
    door_outer_x1, door_outer_x2 = 236, 458
    door_outer_y1, door_outer_y2 = 1428, 1712
    
    door_inner_y1 = 1446
    door_inner_y2 = 1704
    door_left_hinge = 247
    door_center_seam = 347
    door_right_hinge = 447
    
    door_width = float(door_center_seam - door_left_hinge) # 100px
    
    # Door leaf source quads
    src_l = np.float32([
        [door_left_hinge, door_inner_y1],
        [door_center_seam, door_inner_y1],
        [door_center_seam, door_inner_y2],
        [door_left_hinge, door_inner_y2]
    ])
    
    src_r = np.float32([
        [door_center_seam, door_inner_y1],
        [door_right_hinge, door_inner_y1],
        [door_right_hinge, door_inner_y2],
        [door_center_seam, door_inner_y2]
    ])
    
    # Pre-generate interior corridor behind the doors
    interior_clean = cv2.GaussianBlur(entrance_img, (21, 21), 0)
    interior_bright = cv2.convertScaleAbs(interior_clean, alpha=1.25, beta=25)
    gold_tint = np.full_like(interior_bright, (35, 145, 255), dtype=np.uint8)
    interior_lit = cv2.addWeighted(interior_bright, 0.70, gold_tint, 0.30, 0)
    
    # Add subtle ceiling shadow inside the doorway top
    soffit_shadow = np.linspace(0.6, 1.0, 15)[:, np.newaxis, np.newaxis]
    interior_lit[door_inner_y1:door_inner_y1+15, door_left_hinge:door_right_hinge] = \
        (interior_lit[door_inner_y1:door_inner_y1+15, door_left_hinge:door_right_hinge].astype(np.float32) * soffit_shadow).astype(np.uint8)
        
    yy_out, xx_out = np.mgrid[:out_h, :out_w].astype(np.float32)
    
    # Camera path parameters
    start_w = float(w_img)
    start_cx = w_img / 2.0
    start_cy = h_img / 2.0
    
    end_w = 340.0
    end_cx = float(door_center_seam)
    end_cy = (door_inner_y1 + door_inner_y2) / 2.0
    
    # Keyframe timing
    door_open_start = 44
    door_open_end = 66
    flare_start = 52
    flare_peak = 75
    
    for f in range(1, total_frames + 1):
        t = (f - 1) / float(total_frames - 1)
        
        # 1. Camera Ease (Smooth cubic acceleration with nice deceleration)
        t_cam = min(1.0, t / 0.85)
        ease_cam = t_cam * t_cam * (3.0 - 2.0 * t_cam) # smoothstep
        
        cur_w = start_w + (end_w - start_w) * ease_cam
        cur_h = cur_w * (float(out_h) / float(out_w))
        cur_cx = start_cx + (end_cx - start_cx) * ease_cam
        cur_cy = start_cy + (end_cy - start_cy) * ease_cam
        
        # 2. Door Opening Progress
        if f < door_open_start:
            door_t = 0.0
        elif f >= door_open_end:
            door_t = 1.0
        else:
            rel = (f - door_open_start) / float(door_open_end - door_open_start)
            door_t = rel * rel * (3.0 - 2.0 * rel)
            
        angle_deg = door_t * 80.0
        angle_rad = np.radians(angle_deg)
        cos_a = np.cos(angle_rad)
        sin_a = np.sin(angle_rad)
        
        persp_drop = 14.0 * sin_a
        
        facade = entrance_img.copy()
        
        if door_t > 0.001:
            # 1. Fill doorway interior
            facade[door_inner_y1:door_inner_y2, door_left_hinge:door_right_hinge] = \
                interior_lit[door_inner_y1:door_inner_y2, door_left_hinge:door_right_hinge]
                
            # 2. Left door quad swinging inward
            dst_l = np.float32([
                [door_left_hinge, door_inner_y1],
                [door_left_hinge + door_width * cos_a, door_inner_y1 + persp_drop],
                [door_left_hinge + door_width * cos_a, door_inner_y2 - persp_drop],
                [door_left_hinge, door_inner_y2]
            ])
            M_l = cv2.getPerspectiveTransform(src_l, dst_l)
            warped_l = cv2.warpPerspective(entrance_img, M_l, (w_img, h_img), flags=cv2.INTER_LANCZOS4)
            mask_l = np.zeros((h_img, w_img), dtype=np.uint8)
            cv2.fillConvexPoly(mask_l, np.int32(dst_l), 255)
            
            # 3. Right door quad swinging inward
            dst_r = np.float32([
                [door_right_hinge - door_width * cos_a, door_inner_y1 + persp_drop],
                [door_right_hinge, door_inner_y1],
                [door_right_hinge, door_inner_y2],
                [door_right_hinge - door_width * cos_a, door_inner_y2 - persp_drop]
            ])
            M_r = cv2.getPerspectiveTransform(src_r, dst_r)
            warped_r = cv2.warpPerspective(entrance_img, M_r, (w_img, h_img), flags=cv2.INTER_LANCZOS4)
            mask_r = np.zeros((h_img, w_img), dtype=np.uint8)
            cv2.fillConvexPoly(mask_r, np.int32(dst_r), 255)
            
            # Composite doors over interior
            np.copyto(facade, warped_l, where=cv2.merge([mask_l, mask_l, mask_l]) > 0)
            np.copyto(facade, warped_r, where=cv2.merge([mask_r, mask_r, mask_r]) > 0)
            
            # Keep door outer casing (top lintel, threshold, outer sides) perfectly sharp and clean
            facade[door_outer_y1:door_inner_y1, door_outer_x1:door_outer_x2] = \
                entrance_img[door_outer_y1:door_inner_y1, door_outer_x1:door_outer_x2]
            facade[door_inner_y2:door_outer_y2, door_outer_x1:door_outer_x2] = \
                entrance_img[door_inner_y2:door_outer_y2, door_outer_x1:door_outer_x2]
            facade[door_outer_y1:door_outer_y2, door_outer_x1:door_left_hinge] = \
                entrance_img[door_outer_y1:door_outer_y2, door_outer_x1:door_left_hinge]
            facade[door_outer_y1:door_outer_y2, door_right_hinge:door_outer_x2] = \
                entrance_img[door_outer_y1:door_outer_y2, door_right_hinge:door_outer_x2]
                
        # 3. Crop with camera bounds
        x1 = cur_cx - cur_w / 2.0
        x2 = cur_cx + cur_w / 2.0
        y1 = cur_cy - cur_h / 2.0
        y2 = cur_cy + cur_h / 2.0
        
        src_tri = np.float32([
            [x1, y1],
            [x2, y1],
            [x1, y2]
        ])
        dst_tri = np.float32([
            [0, 0],
            [out_w, 0],
            [0, out_h]
        ])
        M_cam = cv2.getAffineTransform(src_tri, dst_tri)
        frame_rendered = cv2.warpAffine(facade, M_cam, (out_w, out_h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        
        # 4. Cinematic Golden Sunburst & Volumetric God Rays
        if f >= flare_start:
            flare_rel = (f - flare_start) / float(flare_peak - flare_start)
            flare_power = np.clip(flare_rel ** 1.6, 0.0, 1.0)
            
            door_world_x = float(door_center_seam)
            door_world_y = (door_inner_y1 + door_inner_y2) / 2.0
            
            door_screen_pt = np.dot(M_cam, np.array([door_world_x, door_world_y, 1.0]))
            fx_c, fy_c = door_screen_pt[0], door_screen_pt[1]
            
            dx = xx_out - fx_c
            dy = yy_out - fy_c
            dist = np.sqrt(dx * dx + dy * dy)
            angle = np.arctan2(dy, dx)
            
            # Primary Starburst Rays (16 rays, slow dynamic rotation)
            rot1 = (f - flare_start) * 0.04
            rays1 = (np.cos(16.0 * (angle + rot1)) * 0.5 + 0.5) ** 2.2
            
            # Secondary Finer Rays (28 rays)
            rot2 = - (f - flare_start) * 0.025
            rays2 = (np.cos(28.0 * (angle + rot2)) * 0.5 + 0.5) ** 3.0
            
            combined_rays = rays1 * 0.7 + rays2 * 0.3
            
            # Volumetric Falloff
            core_rad = 90.0 + flare_power * 850.0
            radial_core = np.exp(-dist / (core_rad * 0.45))
            volumetric_rays = combined_rays * np.exp(-dist / (core_rad * 1.8))
            
            # Anamorphic Streak
            streak = np.exp(-np.abs(dy) / (18.0 + flare_power * 45.0)) * np.exp(-np.abs(dx) / (core_rad * 2.5))
            
            total_light = np.clip(radial_core * 1.4 + volumetric_rays * 1.1 + streak * 0.6, 0.0, 3.0) * flare_power
            
            hot_core_mask = np.clip(np.exp(-dist / (core_rad * 0.22)) * flare_power * 1.8, 0.0, 1.0)
            
            frame_float = frame_rendered.astype(np.float32) / 255.0
            
            light_layer = np.zeros_like(frame_float)
            gold_b, gold_g, gold_r = 0.38, 0.76, 1.00
            
            for ch, gold_val in enumerate([gold_b, gold_g, gold_r]):
                col = gold_val * (1.0 - hot_core_mask) + 1.0 * hot_core_mask
                light_layer[:, :, ch] = total_light * col * 1.25
                
            blended = np.clip(frame_float + light_layer, 0.0, 1.0)
            
            # Screen wash toward peak (frame 68-78)
            if f >= 68:
                wash_rel = (f - 68) / 10.0
                wash_rel = min(1.0, wash_rel)
                wash_col = np.array([0.62, 0.86, 1.00], dtype=np.float32)
                wash_factor = wash_rel ** 1.3 * 0.85
                blended = blended * (1.0 - wash_factor) + (wash_col * wash_factor)
                
            frame_rendered = (np.clip(blended, 0.0, 1.0) * 255.0).astype(np.uint8)
            
            # Smooth blend into original video transition on frames 74..78
            if f >= 74:
                blend_orig_t = (f - 73) / 5.0 # 0.2 to 1.0
                orig_backup_path = f"public/assets/frames_backup_scene1/frame_{f:04d}.jpg"
                if os.path.exists(orig_backup_path):
                    orig_f = cv2.imread(orig_backup_path)
                    if orig_f is not None:
                        frame_rendered = cv2.addWeighted(frame_rendered, 1.0 - blend_orig_t, orig_f, blend_orig_t, 0)
                        
        out_filename = os.path.join(output_dir, f"frame_{f:04d}.jpg")
        cv2.imwrite(out_filename, frame_rendered, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        
    print(f"Rendered all {total_frames} frames into {output_dir} successfully!")

if __name__ == "__main__":
    render_scene1()
