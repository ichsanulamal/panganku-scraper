
use axios to fetch:

```
fetch("https://www.panganku.org/id-ID/semua_nutrisi", {
	"headers": {
	  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
	  "accept-language": "en-US,en;q=0.9",
	  "cache-control": "max-age=0",
	  "priority": "u=0, i",
	  "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
	  "sec-ch-ua-mobile": "?0",
	  "sec-ch-ua-platform": "\"Linux\"",
	  "sec-fetch-dest": "document",
	  "sec-fetch-mode": "navigate",
	  "sec-fetch-site": "same-origin",
	  "sec-fetch-user": "?1",
	  "upgrade-insecure-requests": "1",
	  "Referer": "https://www.panganku.org/id-ID/view",
	  "Referrer-Policy": "strict-origin-when-cross-origin"
	},
	"body": null,
	"method": "GET"
  });```

and then find all the codes e.g., (AP028, ER005, DP024) , print len of arr codes

```
<tr>
								<td>22</td>
								<td>AP028</td>
								<td>Apem, kue</td>
								<td>Serealia</td>
								<td>Olahan (Processed)</td>
							</tr>
							<tr>
								<td>23</td>
								<td>ER005</td>
								<td>Arbai, segar (Arbein, fresh)</td>
								<td>Buah</td>
								<td>Mentah (Raw)</td>
							</tr>
							<tr>
								<td>24</td>
								<td>DP024</td>
								<td>Ares, sayur</td>
								<td>Sayuran</td>
								<td>Olahan (Processed)</td>
							</tr>
```


---
use nodejs

curl 'https://www.panganku.org/id-ID/view' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'accept-language: en-US,en-GB;q=0.9,en;q=0.8,id;q=0.7,eo;q=0.6' \
  -H 'cache-control: max-age=0' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'origin: https://www.panganku.org' \
  -H 'priority: u=0, i' \
  -H 'referer: https://www.panganku.org/id-ID/semua_nutrisi' \
  -H 'sec-ch-ua: "Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Linux"' \
  -H 'sec-fetch-dest: document' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-site: same-origin' \
  -H 'sec-fetch-user: ?1' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36' \
  --data-raw 'haha=GP053'

find this ```
<table>
			             		<tbody><tr>
			             			<td style="width: 100px;" valign="top"><b>Kode</b></td>
			             			<td valign="top">:&nbsp;</td>
			             			<td valign="top">GP053</td>
			             		</tr>
			             		<tr>
			             			<td style="width: 100px;" valign="top"><b>Nama</b></td>
			             			<td valign="top">:&nbsp;</td>
			             			<td valign="top">Abon haruwan</td>
			             		</tr>
			             		<tr>
			             			<td style="width: 100px;" valign="top"><b>Nama Latin</b></td>
			             			<td valign="top">:&nbsp;</td>
			             			<td valign="top"></td>
			             		</tr>
			             		<tr>
			             			<td style="width: 30%;" valign="top"><b>Asal</b></td>
			             			<td valign="top">:&nbsp;</td>
			             			<td valign="top">Kalimantan Selatan </td>
			             		</tr>
			             		<tr>
			             			<td style="width: 30%;" valign="top"><b>Kelompok</b></td>
			             			<td valign="top">:&nbsp;</td>
			             			<td valign="top">Ikan/Kerang/Udang dll</td>
			             		</tr>
			             		<tr>
			             			<td style="width: 30%;" valign="top"><b>Tipe</b></td>
			             			<td valign="top">:&nbsp;</td>
			             			<td valign="top">Olahan (Processed)</td>
			             		</tr>
			             		<tr>
			             			<td style="width: 30%;" valign="top"><b>Deskripsi</b></td>
			             			<td valign="top">:&nbsp;</td>
			             			<td valign="top">Abon dari ikan gabus</td>
			             		</tr>
			             	</tbody></table>
```
clean to json with key and value. e.g., Kode: GP053

---

use cheerio `const $ = cheerio.load(response.data);` nodejs

find 

```<tbody><tr><td>Air (<i>Water</i>)</td>
	<td>&nbsp;:&nbsp;11.6 g</td></tr><tr><td>Energi (<i>Energy</i>)</td>
	<td>&nbsp;:&nbsp;513 Kal</td></tr><tr><td>Protein (<i>Protein</i>)</td>
	<td>&nbsp;:&nbsp;23.7 g</td></tr><tr><td>Lemak (<i>Fat</i>)</td>
	<td>&nbsp;:&nbsp;37.0 g</td></tr><tr><td>Karbohidrat (<i>CHO</i>)</td>
	<td>&nbsp;:&nbsp;21.3 g</td></tr><tr></tr><tr><td>Abu (<i>ASH</i>)</td>
	<td>&nbsp;:&nbsp;6.4 g</td></tr>			             	</tbody>```

clean to json with key and value. e.g.,

Air/Water: 11.6 g
Energi/Energy: 513 Kal
Lemak/Fat: 23.7 g

---


add readme for my github repo:

scraping panganku.org which is indonesian food nutrition website using nodejs

just run npm install 

and then node panganku.js

its so slow, it retrieves 1146 of food nutrition for hours 

im lazy to improve the code to run parallel or concurrent

you can see the output in data.json.