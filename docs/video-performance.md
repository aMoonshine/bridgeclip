# Video download and rendering settings

BridgeClip keeps cloud AI processing on OpenRouter and uses FFmpeg's software
encoder for local rendering. Settings here control source download size and how
many clips render at once.

## Source quality

`DOWNLOAD_RESOLUTION` caps the source download. `source` keeps the source's
available resolution; `2160`, `1440`, `1080`, and `720` request progressively
smaller ceilings. The downloader walks supported formats under the selected
ceiling and reports failure if it cannot honor that ceiling.

The default is `source`, since smart framing may crop into a face and benefits
from the source pixels.

## Clips at a time

`RENDER_CONCURRENCY` controls how many clips render simultaneously. `0` derives
the value from the machine, capped at four. Values from one through eight set an
explicit limit. Higher concurrency can shorten a run while increasing CPU and
memory use.

## Reusing downloaded sources

Downloaded sources can be kept in a user-selected cache folder outside the
temporary job workspace. When the same source is processed again, BridgeClip
can reuse the cached download instead of fetching it again. The folder and cache
budget are managed from Settings.

Rendering uses the software encoder. The former optional NVIDIA encoder setting
was removed because it did not show a useful speed improvement in the owner's
trial.
