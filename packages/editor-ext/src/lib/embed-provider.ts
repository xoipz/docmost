export interface IEmbedProvider {
  id: string;
  name: string;
  regex: RegExp;
  getEmbedUrl: (match: RegExpMatchArray, url?: string) => string;
}

export const embedProviders: IEmbedProvider[] = [
  {
    id: "loom",
    name: "Loom",
    regex: /^https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/([\da-zA-Z]+)\/?/,
    getEmbedUrl: (match, url) => {
      if (url.includes("/embed/")) {
        return url;
      }
      return `https://loom.com/embed/${match[1]}`;
    },
  },
  {
    id: "airtable",
    name: "Airtable",
    regex: /^https:\/\/(www.)?airtable.com\/([a-zA-Z0-9]{2,})\/.*/,
    getEmbedUrl: (match, url: string) => {
      const path = url.split("airtable.com/");
      if (url.includes("/embed/")) {
        return url;
      }
      return `https://airtable.com/embed/${path[1]}`;
    },
  },
  {
    id: "figma",
    name: "Figma",
    regex:
      /^https:\/\/[\w\.-]+\.?figma.com\/(file|proto|board|design|slides|deck)\/([0-9a-zA-Z]{22,128})/,
    getEmbedUrl: (match, url: string) => {
      return `https://www.figma.com/embed?url=${url}&embed_host=docmost`;
    },
  },
  {
    id: "typeform",
    name: "Typeform",
    regex: /^(https?:)?(\/\/)?[\w\.]+\.typeform\.com\/to\/.+/,
    getEmbedUrl: (match, url: string) => {
      return url;
    },
  },
  {
    id: "miro",
    name: "Miro",
    regex: /^https:\/\/(www\.)?miro\.com\/app\/board\/([\w-]+=)/,
    getEmbedUrl: (match, url) => {
      if (url.includes("/live-embed/")) {
        return url;
      }
      return `https://miro.com/app/live-embed/${match[2]}?embedMode=view_only_without_ui&autoplay=true&embedSource=docmost`;
    },
  },
  {
    id: "youtube",
    name: "YouTube",
    regex:
      /^((?:https?:)?\/\/)?((?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
    getEmbedUrl: (match, url) => {
      if (url.includes("/embed/")) {
        return url;
      }
      return `https://www.youtube-nocookie.com/embed/${match[5]}`;
    },
  },
  {
    id: 'bilibili',
    name: 'Bilibili',
    regex: /^https?:\/\/(?:(?:www|m)\.bilibili\.com\/video\/(BV[0-9a-zA-Z]+|av[0-9]+)|player\.bilibili\.com\/player\.html\?(?:aid=([0-9]+)|bvid=([0-9a-zA-Z]+)))/,
    getEmbedUrl: (match, url) => {
      let aid = '';
      let bvid = '';

      if (url.includes("player.bilibili.com")) {
        aid = match[2];
        bvid = match[3];
      } else {
        const pathParts = new URL(url).pathname.split('/');
        const idPart = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
        if (idPart.startsWith('BV')) {
          bvid = idPart;
        } else if (idPart.startsWith('av')) {
          aid = idPart.substring(2);
        }
      }

      const queryParams = 'page=1&as_wide=1&high_quality=1&danmaku=1&autoplay=0';
      if (aid) {
        return `//player.bilibili.com/player.html?aid=${aid}&${queryParams}`;
      }
      if (bvid) {
        return `//player.bilibili.com/player.html?bvid=${bvid}&${queryParams}`;
      }
      return url;
    }
  },
  {
    id: 'netease-music',
    name: '网易云音乐',
    regex: /^https?:\/\/(?:music\.163\.com|y\.music\.163\.com)\/(?:#\/)?(?:song|m\/song)\?id=(\d+)/,
    getEmbedUrl: (match) => {
      const songId = match[1];
      return `//music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
    }
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    regex: /^(https:)?\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/,
    getEmbedUrl: (match) => {
      return `https://player.vimeo.com/video/${match[4]}`;
    },
  },
  {
    id: "framer",
    name: "Framer",
    regex: /^https:\/\/(www\.)?framer\.com\/embed\/([\w-]+)/,
    getEmbedUrl: (match, url: string) => {
      return url;
    },
  },
  {
    id: "gdrive",
    name: "Google Drive",
    regex:
      /^((?:https?:)?\/\/)?((?:www|m)\.)?(drive\.google\.com)\/file\/d\/([a-zA-Z0-9_-]+)\/.*$/,
    getEmbedUrl: (match) => {
      return `https://drive.google.com/file/d/${match[4]}/preview`;
    },
  },
  {
    id: "gsheets",
    name: "Google Sheets",
    regex:
      /^((?:https?:)?\/\/)?((?:www|m)\.)?(docs\.google\.com)\/spreadsheets\/d\/e\/([a-zA-Z0-9_-]+)\/.*$/,
    getEmbedUrl: (match, url: string) => {
      return url;
    },
  },
  {
    id: "iframe",
    name: "Iframe",
    regex: /any-iframe/,
    getEmbedUrl: (match, url) => {
      return url;
    },
  },
];

export function getEmbedProviderById(id: string) {
  return embedProviders.find(
    (provider) => provider.id.toLowerCase() === id.toLowerCase(),
  );
}

export interface IEmbedResult {
  embedUrl: string;
  provider: string;
}

export function getEmbedUrlAndProvider(url: string): IEmbedResult {
  for (const provider of embedProviders) {
    const match = url.match(provider.regex);
    if (match) {
      return {
        embedUrl: provider.getEmbedUrl(match, url),
        provider: provider.name.toLowerCase(),
      };
    }
  }
  return {
    embedUrl: url,
    provider: "iframe",
  };
}
