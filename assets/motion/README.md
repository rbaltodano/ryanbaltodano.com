# Ink heading reveal

`ink-reveal.png` is the unmodified `img/ink.png` asset from CodyHouse’s
[Ink Transition Effect](https://github.com/codyhouse/ink-transition-effect), pinned
at commit `b7ca5a517290fea45eb052939346e6e7b6f8ecea`.

[Tutorial](https://codyhouse.co/gem/ink-transition-effect/)
· [License and copyright notice](https://codyhouse.co/mit)

The original uses a 25-frame sprite for a page transition. This site adapts that
technique as a CSS alpha mask over live HTML headings, at 3000ms with Angrove’s mobile-menu easing
(`cubic-bezier(0.55, 0, 0.17, 1)`). An animated registered integer selects whole
sprite frames; blur follows the same curve. No jQuery or
other runtime dependencies are imported. The mask only exists during the reveal.

## MIT License

Copyright (c) 2014-2026 Amber Creative.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
