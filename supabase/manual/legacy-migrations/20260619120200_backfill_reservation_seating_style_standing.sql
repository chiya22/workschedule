-- 既存予約の立食/着席をすべて立食に統一する
UPDATE reservations
SET seating_style = 'standing'
WHERE seating_style IS DISTINCT FROM 'standing';
