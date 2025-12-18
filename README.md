# 🎁 Wishlist App



A modern, responsive wishlist application designed to help users curate, manage, and share their desired items. Built with **React 19** and **Supabase**, it offers a seamless experience with rich item details and social sharing capabilities.

---

### 🚀 [Live Demo](https://wishlist-khaki-two.vercel.app/)

---

## ✨ Features

- **🔐 Google Authentication**: Secure and effortless sign-in using Google OAuth.
- **📝 Complete Wishlist Management**: Create, read, update, and delete wishlist items with ease.
- **🖼️ Rich Item Details**: Store comprehensive product info including name, price, image, and direct links.
- **🤝 Shareable Wishlists**: Generate unique public links to share your wishlist with friends and family.
- **🎨 Dynamic Theming**: Multiple pre-built themes to personalize your experience.
- **📱 Responsive Design**: A mobile-first interface optimized for all devices using Tailwind CSS and DaisyUI.


## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yulchanshin/wishlist.git
    cd wishlist
    ```

2.  **Install dependencies**
    Navigate to the frontend directory:
    ```bash
    cd frontend
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the `frontend` directory:
    ```bash
    cp .env.example .env # if you have an example file, otherwise just create it
    ```
    Add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup (Supabase)**
    Copy and run the SQL commands below in your Supabase SQL Editor to set up the schema and security policies.

    <details>
    <summary>📄 Click to view SQL Setup Queries</summary>

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
    CREATE POLICY "Enable read access for all users" ON public.wishlist_items FOR SELECT USING (true);
    CREATE POLICY "Users can insert items to their wishlist" ON public.wishlist_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND owner_id = auth.uid()));
    CREATE POLICY "Users can update items in their wishlist" ON public.wishlist_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND owner_id = auth.uid()));
    CREATE POLICY "Users can delete items from their wishlist" ON public.wishlist_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND owner_id = auth.uid()));
    ```
    </details>

5.  **Run the application**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

## 📜 Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint


## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [React Router 7](https://reactrouter.com/)

- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [DaisyUI](https://daisyui.com/), [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)

## 📝 License

This project is licensed under the MIT License.
