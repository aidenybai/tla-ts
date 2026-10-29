(* automatically generated -- do not edit manually *)
theory tlapm_2acc26 imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./everythingisafcn_test.tla", line 21, characters 9-10 *)
lemma ob'4: (* f44f009deabbe9dc291fe960c1c586ad *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_funde_a
assumes v'11: "((((DOMAIN (a_CONSTANTunde_funde_a))) = ((DOMAIN (a_CONSTANTunde_funde_a)))))"
assumes v'12: "(\<forall> a_CONSTANTunde_xunde_a \<in> ((DOMAIN (a_CONSTANTunde_funde_a))) : (((fapply ((a_CONSTANTunde_funde_a), (a_CONSTANTunde_xunde_a))) \<in> (setOfAll(((DOMAIN (a_CONSTANTunde_funde_a))), %a_CONSTANTunde_xunde_a_1. (fapply ((a_CONSTANTunde_funde_a), (a_CONSTANTunde_xunde_a_1))))))))"
shows "(((a_CONSTANTunde_funde_a) \<in> ([((DOMAIN (a_CONSTANTunde_funde_a))) \<rightarrow> (setOfAll(((DOMAIN (a_CONSTANTunde_funde_a))), %a_CONSTANTunde_xunde_a. (fapply ((a_CONSTANTunde_funde_a), (a_CONSTANTunde_xunde_a)))))])))"(is "PROP ?ob'4")
proof -
show "PROP ?ob'4"
using assms by auto
qed
end
