import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavBar } from "@/components/custom/navbar";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser, verifyToken } from "@/lib/db";
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "VibeTribe"
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	let loggedIn = false;
	let isAdmin = false;
	if(cookies().get("session")?.value){
		try{
			const id = await verifyToken(cookies().get("session")?.value!)
			isAdmin = (await getUser(id)).is_admin
			loggedIn = true;
		}catch(error){
			loggedIn = false;
		}
	}

	const invalidateSession = async () => {
		"use server"
        cookies().delete("session");
        redirect("/login");
    }

	return (
		<html lang="en">
			<body className={cn(inter.className, "flex flex-col h-screen")}>
				<NavBar loggedIn={loggedIn} isAdmin={isAdmin} invalidateSession={invalidateSession}/>
				{children}
			</body>
		</html>
	);
}
