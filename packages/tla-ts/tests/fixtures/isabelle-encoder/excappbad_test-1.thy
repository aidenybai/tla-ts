(* automatically generated -- do not edit manually *)
theory tlapm_dc538d imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./excappbad_test.tla", line 14, characters 5-11 *)
lemma ob'1: (* 73d4be24e6342219e0df30f5ea980b06 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Aunde_a
fixes a_CONSTANTunde_Bunde_a
fixes a_CONSTANTunde_funde_a
assumes a_CONSTANTunde_funde_a_in : "(a_CONSTANTunde_funde_a \<in> ([(a_CONSTANTunde_Aunde_a) \<rightarrow> (a_CONSTANTunde_Bunde_a)]))"
fixes a_CONSTANTunde_xunde_a
assumes a_CONSTANTunde_xunde_a_in : "(a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Aunde_a))"
fixes a_CONSTANTunde_yunde_a
assumes a_CONSTANTunde_yunde_a_in : "(a_CONSTANTunde_yunde_a \<in> (a_CONSTANTunde_Aunde_a))"
fixes a_CONSTANTunde_aunde_a
fixes a_CONSTANTunde_bunde_a
shows "(((fapply (([([(a_CONSTANTunde_funde_a) EXCEPT ![(a_CONSTANTunde_xunde_a)] = (a_CONSTANTunde_aunde_a)]) EXCEPT ![(a_CONSTANTunde_yunde_a)] = (a_CONSTANTunde_bunde_a)]), (a_CONSTANTunde_xunde_a))) = (a_CONSTANTunde_aunde_a)))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
using assms by auto
qed
end
