// Code generated by protoc-gen-go-grpc. DO NOT EDIT.
// versions:
// - protoc-gen-go-grpc v1.5.1
// - protoc             v6.30.1
// source: image_to_svg.proto

package pb

import (
	context "context"
	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
)

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
// Requires gRPC-Go v1.64.0 or later.
const _ = grpc.SupportPackageIsVersion9

const (
	ImageToSvg_ConvertImage_FullMethodName = "/ImageToSvg/ConvertImage"
)

// ImageToSvgClient is the client API for ImageToSvg service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type ImageToSvgClient interface {
	ConvertImage(ctx context.Context, in *ImageRequest, opts ...grpc.CallOption) (*SvgResponse, error)
}

type imageToSvgClient struct {
	cc grpc.ClientConnInterface
}

func NewImageToSvgClient(cc grpc.ClientConnInterface) ImageToSvgClient {
	return &imageToSvgClient{cc}
}

func (c *imageToSvgClient) ConvertImage(ctx context.Context, in *ImageRequest, opts ...grpc.CallOption) (*SvgResponse, error) {
	cOpts := append([]grpc.CallOption{grpc.StaticMethod()}, opts...)
	out := new(SvgResponse)
	err := c.cc.Invoke(ctx, ImageToSvg_ConvertImage_FullMethodName, in, out, cOpts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// ImageToSvgServer is the server API for ImageToSvg service.
// All implementations must embed UnimplementedImageToSvgServer
// for forward compatibility.
type ImageToSvgServer interface {
	ConvertImage(context.Context, *ImageRequest) (*SvgResponse, error)
	mustEmbedUnimplementedImageToSvgServer()
}

// UnimplementedImageToSvgServer must be embedded to have
// forward compatible implementations.
//
// NOTE: this should be embedded by value instead of pointer to avoid a nil
// pointer dereference when methods are called.
type UnimplementedImageToSvgServer struct{}

func (UnimplementedImageToSvgServer) ConvertImage(context.Context, *ImageRequest) (*SvgResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ConvertImage not implemented")
}
func (UnimplementedImageToSvgServer) mustEmbedUnimplementedImageToSvgServer() {}
func (UnimplementedImageToSvgServer) testEmbeddedByValue()                    {}

// UnsafeImageToSvgServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to ImageToSvgServer will
// result in compilation errors.
type UnsafeImageToSvgServer interface {
	mustEmbedUnimplementedImageToSvgServer()
}

func RegisterImageToSvgServer(s grpc.ServiceRegistrar, srv ImageToSvgServer) {
	// If the following call pancis, it indicates UnimplementedImageToSvgServer was
	// embedded by pointer and is nil.  This will cause panics if an
	// unimplemented method is ever invoked, so we test this at initialization
	// time to prevent it from happening at runtime later due to I/O.
	if t, ok := srv.(interface{ testEmbeddedByValue() }); ok {
		t.testEmbeddedByValue()
	}
	s.RegisterService(&ImageToSvg_ServiceDesc, srv)
}

func _ImageToSvg_ConvertImage_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ImageRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(ImageToSvgServer).ConvertImage(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: ImageToSvg_ConvertImage_FullMethodName,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(ImageToSvgServer).ConvertImage(ctx, req.(*ImageRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// ImageToSvg_ServiceDesc is the grpc.ServiceDesc for ImageToSvg service.
// It's only intended for direct use with grpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var ImageToSvg_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "ImageToSvg",
	HandlerType: (*ImageToSvgServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "ConvertImage",
			Handler:    _ImageToSvg_ConvertImage_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "image_to_svg.proto",
}
