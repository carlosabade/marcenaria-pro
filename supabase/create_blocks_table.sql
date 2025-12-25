
-- Create table for custom furniture blocks
CREATE TABLE IF NOT EXISTS public.custom_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'cozinha', 'sala', 'dormitorio', 'banheiro'
    dimensions JSONB NOT NULL, -- { width, height, depth }
    elements JSONB NOT NULL, -- The array of drawing elements (lines, rects, circles)
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.custom_blocks ENABLE ROW LEVEL SECURITY;

-- Allow public access (as per current project development mode)
CREATE POLICY "Allow public read access"
ON public.custom_blocks FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access"
ON public.custom_blocks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access"
ON public.custom_blocks FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access"
ON public.custom_blocks FOR DELETE
USING (true);

-- Create storage bucket for block thumbnails if needed later
-- insert into storage.buckets (id, name, public) values ('block-previews', 'block-previews', true);
