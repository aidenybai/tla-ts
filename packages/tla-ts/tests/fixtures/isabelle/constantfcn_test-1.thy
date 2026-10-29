(* automatically generated -- do not edit manually *)
theory tlapm_edb34c imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./constantfcn_test.tla", line 13, characters 5-6 *)
lemma ob'1: (* 9860a35fedbfad551e768642c38f9866 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
shows "(((fapply (([ a_CONSTANTunde_yunde_a \<in> ({((succ[0]))})  \<mapsto> ((0))]), ((0)))) = ((0))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by auto
qed
end
