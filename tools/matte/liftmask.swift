import Foundation
import Vision
import CoreImage

// Emits a grayscale PNG matte for ALL foreground instances found in the image.
// Union of every instance so flying props / limbs are never dropped.
let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: liftmask <input> <output-mask.png>\n".data(using: .utf8)!)
    exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

let handler = VNImageRequestHandler(url: inURL, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([req]) } catch {
    FileHandle.standardError.write("ERR perform: \(error)\n".data(using: .utf8)!); exit(1)
}
guard let obs = req.results?.first as? VNInstanceMaskObservation else {
    FileHandle.standardError.write("ERR no observation\n".data(using: .utf8)!); exit(3)
}
let all = obs.allInstances
guard !all.isEmpty else {
    FileHandle.standardError.write("ERR zero instances\n".data(using: .utf8)!); exit(4)
}
guard let buf = try? obs.generateScaledMaskForImage(forInstances: all, from: handler) else {
    FileHandle.standardError.write("ERR mask gen\n".data(using: .utf8)!); exit(5)
}
let ci = CIImage(cvPixelBuffer: buf)
let ctx = CIContext(options: [.workingColorSpace: NSNull()])
guard let cs = CGColorSpace(name: CGColorSpace.linearGray) else { exit(6) }
do {
    try ctx.writePNGRepresentation(of: ci, to: outURL, format: .L8, colorSpace: cs)
} catch {
    FileHandle.standardError.write("ERR write: \(error)\n".data(using: .utf8)!); exit(7)
}
FileHandle.standardError.write("instances=\(all.count) size=\(Int(ci.extent.width))x\(Int(ci.extent.height))\n".data(using: .utf8)!)
