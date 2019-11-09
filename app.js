const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.use(async (req, res) => {
  const url = req.query.url;
  let scale = req.query.scale;
  if (scale!=null && !isNaN(scale)) scale = parseFloat(req.query.scale);
  if (scale < 0.11) scale = 0.1;
  else if (scale > 2.0) scale = 2.0;
  let chill = req.query.chill;
  if (chill!=null && !isNaN(chill)) chill = parseInt(req.query.chill);
  if (chill < 0) chill = 0;
  else if (chill > 60000) chill = 60000;

  if (!url) {
    return res.send('Please url as a parameter, and scale from 0.1 to 2.0, ' +
        'for example: <a href="/?url=https://getbootstrap.com/docs/4.0/layout/grid/&scale=0.8">?url=https://vrgoseattle.co&scale=0.8</a>');
  }


  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // This did not appear to affect pdf sizing
  //page.setViewport({width: 3000, height: 800})

  await page.goto(url, {waitUntil: 'networkidle0'});

  // it may be overkill to scroll the rendered page, but here we are
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  })
  // this is also probably overkill, but you can tell the browser to just wait an arbitrary amount of time in ms up to a minute in ms
  await timeout(chill)

  //TODO: inject DOM styles with some logic to prevent ugly page breaks on things like images

  // const imgs = await page.$$eval('img', imgs =>  {
  //   return imgs
  // });

  //console.log(imgs);
  // const allImgHandle = 'img';
  // await page.waitForSelector(allImgHandle);
  // console.log('ok');
  //
  // await page.evaluate(allImgHandle => {
  //   console.log('ok');
  //   const imgArr = Array.from(document.querySelectorAll(allImgHandle));
  //   imgArr.forEach(function (imgEl) {
  //      console.log(imgEl.src);
  //   });
  // }, allImgHandle);

  const pdf = await page.pdf({format: 'A4', scale: scale});
  await browser.close();
  res.setHeader("Content-Type", "application/pdf");
  res.send(pdf);

  //TODO: include image export in params as an alternative option to pdf

  //const imageBuffer = await page.screenshot();
  //browser.close();

 // res.set('Content-Type', 'image/png');
 // res.send(imageBuffer);
});

const server = app.listen(process.env.PORT || 8080, err => {
  if (err) return console.error(err);
  const port = server.address().port;
  console.info(`App listening on port ${port}  \ntry http://localhost:${port}/?scale=0.6&url=https://getbootstrap.com/docs/4.0/layout/grid/&chill=0`);
});
