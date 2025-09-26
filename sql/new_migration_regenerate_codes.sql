-- Migration to regenerate static "test" community codes with unique dynamic codes
-- This script identifies communities with code 'test' or 'TEST' and replaces them with unique codes

DO $$
DECLARE
    community_record RECORD;
    new_code TEXT;
    counter INTEGER := 1;
BEGIN
    -- Loop through communities with static test codes
    FOR community_record IN
        SELECT id, name, code
        FROM public.communities
        WHERE code ILIKE 'test'
    LOOP
        -- Generate a unique new code
        LOOP
            new_code := 'ADMIN' || LPAD(counter::TEXT, 3, '0');
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.communities WHERE code = new_code
            );
            counter := counter + 1;
        END LOOP;

        -- Update the community with the new code
        UPDATE public.communities
        SET code = new_code
        WHERE id = community_record.id;

        RAISE NOTICE 'Regenerated code for community "%" (ID: %) from "%" to "%"',
            community_record.name, community_record.id, community_record.code, new_code;

        counter := counter + 1;
    END LOOP;

    -- If no communities were updated, log that
    IF counter = 1 THEN
        RAISE NOTICE 'No communities with static "test" codes found. Migration complete.';
    END IF;
END $$;
