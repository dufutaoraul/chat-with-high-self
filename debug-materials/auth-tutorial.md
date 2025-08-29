轻松接入邮件登陆注册功能（Auth）
[chapter4：接入注册登陆-1.mp4]
1. Supabase的登陆注册方案
1.1 支持的登陆方式

进入到「Authentication」-「Sign In/Up」页面，你会看到很多Auth Provider。supabase不仅支持邮件登录，还支持基本上市面上所有常见的第三方登陆，比如说Github、Google。Discord Apple。你只需要在supabase的后台启用，并且填入相应平台的key等信息，就能启动第三方平台的登陆注册功能。
1.2 邮件登陆
目前邮件注册登录的方式是默认支持的。我们可以点击Emails，去调整邮件的相应模板（Templates）。

在上线前，需要大家SMTP Settings。调整成自己邮件服务商的地址。
提示
目前所使用的邮箱服务是supabase提供的，会有速率限制。上线前请务必调整成自己的邮箱服务，填入相关信息就好。例如Resend、163邮箱。

这边我拿163举例，点击「设置」 - 「POP3/SMTP/IMAP」


然后开启服务，并新增授权密码，保存这个授权密码。


然后填入你的授权密码和邮箱，就能够支持自己的SMTP邮件服务商了。其他邮件服务商的方式也都类似。

提示：
163等免费SMTP服务会有每日邮件限制（官方并没有明确公开具体的数字）。但是一般非商业化项目注册使用完全够了，如果你有更多需求。建议使用Resend等专业的邮件服务商。
2. 给项目添加登陆/注册/登出
1. 注册
这边我们的模板当中是自动帮你集成了邮件登录注册的，所以你如果在上一步的环境变量只要填写正确，其实你无需任何的配置。我们可以直接输入自己的邮箱和密码进行注册。

虽然我们的模板自动集成了登录注册功能，但是也不妨我们来看一下sup实现注册有多简单，其实也就是下面这一个方法的事情：
JavaScript
app/actions.ts
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
然后进入到我们的邮箱内，就看到我们邀请注册了。

2. 登录
3. 登陆后的页面

登录成功之后呢，你会被重定向到这个/protected页面。 看到他是很多代码别慌！这个页面其实是一个用户后台页面，你可以自行修改这个页面。
很多的网站都是这样的操作，首页其实是落地页，用户没有登录的时候也可以查看，但是一旦用户登录了，就会被重定向到一个后台页面，或者叫做用户仪表盘页面。
4. 移除掉重定向
但是我们的落地页不需要这个页面，因为我们的首页就是我们的Todo的产品功能，所以说我们关闭这个重定向功能。
1.找到utils/supabase/middleware.ts这个文件，注释掉这几行代码。
JavaScript
utils/supabase/middleware.ts
//if (request.nextUrl.pathname === "/" && !user.error) {
//   return NextResponse.redirect(new URL("/protected", request.url));
// }
2.在app/actions.ts中，将登陆后的重定向路径修改成 /
JavaScript
export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }
  
  //return redirect("/protected");
  return redirect("/"); // 修改这行成/
};
3.将app/auth/callback/route.ts中的重定向功能修改
JavaScript
export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  //return NextResponse.redirect(`${origin}/protected`);
  return NextResponse.redirect(`${origin}/`);
}

这样我们登录之后就回到了首页


5. 退出登陆
现在你可能会发现在登录态的时候，右上角不应该显示登录和注册按钮。所以我们来修改这个逻辑。在Cursor的Composer中输入以下提示词：
Markdown
提示词
修改右上角按钮的显示逻辑，如果用户是登录的状态，那么应该显示退出登录用户点击退出按钮后。调用 @actions.ts 中的退出登陆方法。

再回到页面检查一下效果，这就完成退出登陆的功能了!

完成项目的登陆注册功能
可以看到基于模板和supabase，完成一个登陆注册功能真的很简单。

3. 未登录重定向

接下来我们给页面新增加一个逻辑，就是如果用户没有登录的话，那么此时用户去新增Todo的时候，应该让他重定向到登录页面，并且修改下方的文案。

在Cursor的Composer中输入以下提示词:
Markdown
1. @page.tsx 给页面增加一个逻辑，如果用户在添加todo的时候，没有登陆，那么应该重定向到登陆页面
2. 下方文案「开始计划点什么吧」，如果在没有登录的时候，显示登录后制定Todo
之后检查一下，这就达成了我们想要的需求：

4. supabase方法总结
虽然这个模板帮我们在登录注册这儿做了非常多的事情，但是我们也可以来学习一下supabase是如何简化登录注册方案的。
模板中封装登录注册的主要逻辑是在app/actions.ts这个文件里面：
4.1 注册
supabase.auth.signUp() ：该方法是supabase邮件密码注册的方法，只需要传入邮件和密码，并传入注册后的重定向地址就能够实现注册。
JavaScript
app/actions.ts
const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
4.2 登陆
supabase.auth.signInWithPassword() : 该方法是实现邮件密码登录的方法，参数是email和password。
JavaScript
app/actions.ts
const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
4.3 退出登陆
supabase.auth.signOut()：该方法是实现退出登录的方法。
JavaScript
app/actions.ts
await supabase.auth.signOut();

友情提示
记得git commit保存项目代码哦~
