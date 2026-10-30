(* automatically generated -- do not edit manually *)
theory tlapm_2b7ffe imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./TLAPS.tla", line 172, characters 1-52 *)
lemma ob'2: (* e289e838327c2388d63e8a730e9a2a61 *)
shows "(\<forall>a_CONSTANTunde_Sunde_a : (\<exists>a_CONSTANTunde_xunde_a : (((a_CONSTANTunde_xunde_a) \<notin> (a_CONSTANTunde_Sunde_a)))))"(is "PROP ?ob'2")
proof -
show "PROP ?ob'2"
by (auto intro: inIrrefl)
qed
end
