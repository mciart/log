import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION, SITE_TAB, SITE_LANG } from "../consts";
import { marked } from 'marked';

export async function GET(context: any) {
  const posts = await getCollection("blog");
  const sortedPosts = posts.sort((a: any, b: any) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime());
  function replacePath(content: string, siteUrl: string): string {
    return content.replace(/(src|img|r|l)="([^"]+)"/g, (match, attr, src) => {
      if (!src.startsWith("http") && !src.startsWith("//") && !src.startsWith("data:")) {
        return `${attr}="${new URL(src, siteUrl).toString()}"`;
      }
      return match;
    });
  }

  const items = await Promise.all(sortedPosts.map(async (post: any) => {
    const { data: { title, description, pubDate }, body, slug } = post;

    const content = body
      ? `<![CDATA[${replacePath(await marked(body), context.site)}]]>`
      : "No content available.";

    return {
      title: `<![CDATA[${title}]]>`,
      description: `<![CDATA[${description}]]>`,
      link: `/blog/${slug}/`,
      guid: `${context.site}/blog/${slug}/`,
      content: `<blockquote>该渲染由 Frosti Feed 自动生成，可能存在排版问题，最佳体验请前往：<a href="${context.site}/blog/${slug}/">${context.site}/blog/${slug}/</a></blockquote> <![CDATA[${content}]]>`,
      customData: `
        <dc:creator><![CDATA[${SITE_TAB}]]></dc:creator>
        <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      `,
    };
  }));

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: items,
    customData: `
      <language>${SITE_LANG}</language>
    `,
    xmlns: {
      'dc': "http://purl.org/dc/elements/1.1/",
      'content': "http://purl.org/rss/1.0/modules/content/",
      'atom': "http://www.w3.org/2005/Atom",
      version: "2.0",
    }
  });
}
