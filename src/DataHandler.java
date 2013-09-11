import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.Date;

import javax.servlet.http.*;
import javax.servlet.*;

public class DataHandler extends HttpServlet {
	/**
	 * 
	 */
	private static final long serialVersionUID = 3398616801930204381L;

	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("text/html");
		PrintWriter out = response.getWriter();
		out.println("<html>");
		out.println("<head>");
		out.println("<title>Servlet</title>");
		out.println("</head>");
		out.println("<body>");
		out.println("Hello Java Servlets!<br />Current Date: " + new Date());
		out.println("</body>");
		out.println("</html>");
	}

	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException,
			java.io.IOException {
		HttpSession session = request.getSession();
		UserService userService = new UserServiceImpl();
		String abspath = getServletContext().getRealPath("/");
		UserService.setBasePath(abspath);
		PrintWriter out = response.getWriter();
		String type = request.getHeader("type").toLowerCase();

		if (type.equals("save")) {
			// if request to save XML file
			response.setContentType("text/html");
			String content = "";
			try {
				content = userService.saveUserData((String)session.getAttribute("username"),
						request.getInputStream());
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}

			// Respond content of the file
			out.println(content);
		} else if (type.equals("load")) {
			// request to load XML file
			response.setContentType("text/xml");
			String username = (String)session.getAttribute("username");
			String content = "";
			try {
				content = userService.loadUserData(username);
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			out.print(content);
		} else if (type.equals("login")) {
			// User login
			
			String _usr = request.getParameter("usr");
			String _psw = request.getParameter("psw");
			
			String auth = userService.authenticate(_usr, _psw);
			response.setContentType("text/plain");
			if(auth.equals(UserService.LOGIN_INVALID_USERNAME) || 
					auth.equals(UserService.LOGIN_INVALID_PASSWORD)){
				response.setHeader("auth", "ERROR");
				out.write("Error: invalid username/password");
			} else {
				session.setAttribute("username", _usr);
				response.setHeader("auth", "OK");
				out.write("./newIndex.jsp");
			}
		}
		out.close();
	}
}
