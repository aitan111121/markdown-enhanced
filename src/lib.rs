use zed_extension_api as zed;

struct MarkdownPreviewEnhanced;

impl zed::Extension for MarkdownPreviewEnhanced {
    fn new() -> Self {
        Self
    }
}

zed::register_extension!(MarkdownPreviewEnhanced);