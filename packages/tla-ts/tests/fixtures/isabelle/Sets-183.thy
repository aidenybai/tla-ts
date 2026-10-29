(* automatically generated -- do not edit manually *)
theory tlapm_71c6cb imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./Sets.tla", line 290, characters 7-8 *)
lemma ob'183: (* 1cd0a3aae4bedbc594dc1ec4464c11af *)
(* usable definition CONSTANT_NatInductiveDefHypothesis_ suppressed *)
(* usable definition CONSTANT_NatInductiveDefConclusion_ suppressed *)
(* usable definition CONSTANT_FiniteNatInductiveDefHypothesis_ suppressed *)
(* usable definition CONSTANT_FiniteNatInductiveDefConclusion_ suppressed *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
(* usable definition CONSTANT_IsBijection_ suppressed *)
(* usable definition CONSTANT_IsFiniteSet_ suppressed *)
fixes a_CONSTANTunde_Cardinalityunde_a
fixes a_CONSTANTunde_nunde_a
assumes a_CONSTANTunde_nunde_a_in : "(a_CONSTANTunde_nunde_a \<in> (Nat))"
fixes a_CONSTANTunde_Sunde_a
assumes v'47: "((a_CONSTANTunde_IsFiniteSetunde_a ((a_CONSTANTunde_Sunde_a))))"
assumes v'48: "((((a_CONSTANTunde_Cardinalityunde_a ((a_CONSTANTunde_Sunde_a)))) = ((addint ((a_CONSTANTunde_nunde_a), ((succ[0])))))))"
fixes a_CONSTANTunde_Tunde_a
assumes v'50: "((a_CONSTANTunde_IsFiniteSetunde_a ((a_CONSTANTunde_Tunde_a))))"
assumes v'51: "((less (((a_CONSTANTunde_Cardinalityunde_a ((a_CONSTANTunde_Tunde_a)))), ((a_CONSTANTunde_Cardinalityunde_a ((a_CONSTANTunde_Sunde_a)))))))"
fixes a_CONSTANTunde_funde_a
assumes a_CONSTANTunde_funde_a_in : "(a_CONSTANTunde_funde_a \<in> ([(a_CONSTANTunde_Sunde_a) \<rightarrow> (a_CONSTANTunde_Tunde_a)]))"
assumes v'59: "(((a_CONSTANTunde_IsFiniteSetunde_a (({})))) & (\<forall>a_CONSTANTunde_Sunde_a_1 : ((((((a_CONSTANTunde_IsFiniteSetunde_a ((a_CONSTANTunde_Sunde_a_1)))) \<and> ((((a_CONSTANTunde_Cardinalityunde_a ((a_CONSTANTunde_Sunde_a_1)))) = ((0)))))) \<Rightarrow> (((a_CONSTANTunde_Sunde_a_1) = ({})))))))"
assumes v'60: "((((a_CONSTANTunde_Cardinalityunde_a (({})))) = ((0))))"
shows "(((a_CONSTANTunde_Sunde_a) \<noteq> ({})))"(is "PROP ?ob'183")
proof -
show "PROP ?ob'183"
using assms by force
qed
end
