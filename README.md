# Wishlist
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/yulchanshin/wishlist)

A modern, responsive wishlist application that allows users to curate, manage, and share their desired items. Built with React and Supabase, it provides a seamless experience for creating personal wishlists with rich details, including product links, prices, and images.

## Key Features

- **Google Authentication:** Secure and easy sign-in using Google OAuth.
- **Wishlist Management:** Full CRUD (Create, Read, Update, Delete) functionality for wishlist items.
- **Rich Item Details:** Add products with a name, price, image URL, and a direct link to the product page.
- **Shareable Wishlists:** Generate a unique, shareable link for your wishlist to send to friends and family.
- **Dynamic Theming:** Choose from a variety of pre-built themes to personalize the app's appearance.
- **Responsive UI:** A clean interface built with Tailwind CSS and daisyUI that works beautifully on all devices.

## Tech Stack

- **Frontend:**
  - [React](https://react.dev/) & [Vite](https://vitejs.dev/)
  - [React Router](https://reactrouter.com/) for routing
  - [Zustand](https://github.com/pmndrs/zustand) for state management
  - [Tailwind CSS](https://tailwindcss.com/) & [daisyUI](https://daisyui.com/) for styling
  - [lucide-react](https://lucide.dev/) for icons
- **Backend & Database:**
  - [Supabase](https://supabase.io/) (PostgreSQL Database, Authentication, Instant APIs)

## Supabase Setup

To run this project, you need to set up a Supabase backend.

1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com) and create a new project.

2.  **Set up Database Schema:** In the Supabase SQL Editor, run the following queries to create the necessary tables and row-level security policies.

    ```sql
    -- Create the wishlists table
    CREATE TABLE public.wishlists (
      id UUID DEFAULT gen_random_uuid() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      owner_id UUID NOT NULL,
      share_slug TEXT NOT NULL,
      CONSTRAINT wishlists_pkey PRIMARY KEY (id),
      CONSTRAINT wishlists_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users (id) ON DELETE CASCADE,
      CONSTRAINT wishlists_share_slug_key UNIQUE (share_slug)
    );
    ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

    -- Create the wishlist_items table
    CREATE TABLE public.wishlist_items (
      id UUID DEFAULT gen_random_uuid() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      wishlist_id UUID NOT NULL,
      name TEXT NOT NULL,
      price NUMERIC,
      image TEXT,
      link TEXT,
      CONSTRAINT wishlist_items_pkey PRIMARY KEY (id),
      CONSTRAINT wishlist_items_wishlist_id_fkey FOREIGN KEY (wishlist_id) REFERENCES public.wishlists (id) ON DELETE CASCADE
    );
    ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

    -- Policies for wishlists table
    CREATE POLICY "Enable read access for all users" ON public.wishlists FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = owner_id);
    CREATE POLICY "Users can update their own wishlist" ON public.wishlists FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

    -- Policies for wishlist_items table
    CREATE POLICY "Enable read access for all users" ON public.wishlist_items ഫോർ SELECT USING (true);
    CREATE POLICY "Users can insert items to their wishlist" ON public.wishlist_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND owner_id = auth.uid()));
    CREATE POLICY "Users can update items in their wishlist" ON public.wishlist_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND owner_id = auth.uid()));
    CREATE POLICY "Users can delete items from their wishlist" ON public.wishlist_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND owner_id = auth.uid()));
    ```

3.  **Configure Google Auth:**
    - In your Supabase project, navigate to `Authentication` -> `Providers` and enable `Google`.
    - Follow the Supabase documentation to obtain your `Client ID` and `Client Secret` from the Google Cloud Console.
    - In the Supabase Google provider settings, add your local development callback URL to `Redirect URIs`: `http://localhost:5173/auth/callback`. You will need to add your production URL here as well after deployment.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/yulchanshin/wishlist.git
    cd wishlist
    ```
2.  **Navigate to the Frontend Directory:**
    ```bash
    cd frontend
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Set Up Environment Variables:**
    - Create a `.env` file in the `frontend` directory.
    - In your Supabase project, navigate to `Settings` -> `API`.
    - Copy the **Project URL** and the **`anon` public** key.
    - Add them to your `.env` file:
      ```env
      VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
      VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
      ```

5.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Your application should now be running at `http://localhost:5173`.

## Available Scripts

In the `frontend` directory, you can run the following scripts:

-   `npm run dev`: Starts the application in development mode.
-   `npm run build`: Creates a production-ready build of the application.
-   `npm run lint`: Lints the code using ESLint.
-   `npm run preview`: Starts a local server to preview the production build.
