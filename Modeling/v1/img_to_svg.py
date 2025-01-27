import aspose.words as aw

doc = aw.Document()
builder = aw.DocumentBuilder(doc)

shape = builder.insert_image("miami_logo.jpg")
shape.get_shape_renderer().save("miami_logo.svg", aw.saving.ImageSaveOptions(aw.SaveFormat.SVG))