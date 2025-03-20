import grpc
from concurrent import futures
import image_to_svg_pb2
import image_to_svg_pb2_grpc
from img_to_svg import image_to_svg, PrintType
from PIL import Image
import io

class ImageToSvgServicer(image_to_svg_pb2_grpc.ImageToSvgServicer):
    def ConvertImage(self, request, context):
        try:
            # Convert bytes to an image
            image = Image.open(io.BytesIO(request.image_data))
            
            # Determine the method
            method = PrintType.SOLID
            if request.method == "custom":
                method = PrintType.CUSTOM
            elif request.method == "text":
                method = PrintType.TEXT
            
            # Process the image
            svg_data = image_to_svg(image, method=method)
            
            # Return the SVG data
            return image_to_svg_pb2.SvgResponse(svg_data=svg_data)
        except Exception as e:
            # Log the error and return a gRPC error
            print(f"Error processing image: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Error processing image: {e}")
            return image_to_svg_pb2.SvgResponse()

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    image_to_svg_pb2_grpc.add_ImageToSvgServicer_to_server(ImageToSvgServicer(), server)
    server.add_insecure_port("[::]:50051")
    print("Python gRPC server running on port 50051...")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()