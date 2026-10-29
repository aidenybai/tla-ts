(* automatically generated -- do not edit manually *)
theory tlapm_1ed0ff imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./NaturalsInduction_proofs.tla", line 30, characters 1-2 *)
lemma ob'1: (* e9df59a9c7394de974299cd8e46b897a *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Punde_a
assumes v'5: "((a_CONSTANTunde_Punde_a (((0)))))"
assumes v'6: "(\<forall> a_CONSTANTunde_nunde_a \<in> (Nat) : ((((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_nunde_a)))) \<Rightarrow> ((a_CONSTANTunde_Punde_a (((addint ((a_CONSTANTunde_nunde_a), ((succ[0])))))))))))"
shows "(\<forall> a_CONSTANTunde_nunde_a \<in> (Nat) : ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_nunde_a)))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
using assms by (intro natInduct, auto)
qed
end
