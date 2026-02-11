select count(openid),openid,u_name,max(last_used) as last_used  from 
(select user.openid as openid,user.user_name as u_name,uc.updatedAt as last_used from user 
inner join user_record_cleanpaper_image as uc
on user.openid = uc.user_id) as r1
group by r1.openid,r1.u_name

