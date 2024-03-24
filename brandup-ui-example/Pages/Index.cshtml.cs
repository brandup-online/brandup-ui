using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace brandup_ui_example.Pages
{
    [IgnoreAntiforgeryToken]
    public class IndexModel : PageModel
    {
        public void OnGet()
        {

        }

        public async Task<IActionResult> OnPostUploadFile()
        {
            using var ms = new MemoryStream();
            await Request.Body.CopyToAsync(ms);

            return new OkObjectResult(new UploadFileModel
            {
                BodySize = ms.Length,
                ContentLength = Request.ContentLength,
                ContentType = Request.ContentType
            });
        }

        public IActionResult OnPostUploadForm()
        {
            return new OkObjectResult(new UploadFormModel
            {
                Fields = Request.Form.Count,
                Files = Request.Form.Files.Count
            });
        }

        public class UploadFileModel
        {
            public long BodySize { get; set; }
            public long? ContentLength { get; set; }
            public string ContentType { get; set; }
        }

        public class UploadFormModel
        {
            public int Fields { get; set; }
            public int Files { get; set; }
        }
    }
}
