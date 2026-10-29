(* automatically generated -- do not edit manually *)
theory tlapm_9e1ee7 imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./select_bug_test.tla", line 40, characters 1-2 *)
lemma ob'3: (* 6908378724c34d63c8d53d15a86dd2a3 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Defunde_a
assumes v'7: "((\<And> a_CONSTANTunde_Defunde_a_1 :: c => c => c. (\<forall> a_CONSTANTunde_nunde_a \<in> (Nat) : (\<forall>a_CONSTANTunde_funde_a : (\<forall>a_CONSTANTunde_f0unde_a : (((((a_CONSTANTunde_funde_a) = (Choice(%a_CONSTANTunde_gunde_a. (((a_CONSTANTunde_gunde_a) = ([ a_CONSTANTunde_iunde_a \<in> ((intvl (((0)), (a_CONSTANTunde_nunde_a))))  \<mapsto> (cond((((a_CONSTANTunde_iunde_a) = ((0)))), (a_CONSTANTunde_f0unde_a), ((a_CONSTANTunde_Defunde_a_1 ((fapply ((a_CONSTANTunde_gunde_a), ((subint ((a_CONSTANTunde_iunde_a), ((succ[0]))))))), (a_CONSTANTunde_iunde_a))))))]))))))) \<Rightarrow> ((((a_CONSTANTunde_funde_a) = ([ a_CONSTANTunde_iunde_a \<in> ((intvl (((0)), (a_CONSTANTunde_nunde_a))))  \<mapsto> (cond((((a_CONSTANTunde_iunde_a) = ((0)))), (a_CONSTANTunde_f0unde_a), ((a_CONSTANTunde_Defunde_a_1 ((fapply ((a_CONSTANTunde_funde_a), ((subint ((a_CONSTANTunde_iunde_a), ((succ[0]))))))), (a_CONSTANTunde_iunde_a))))))]))) & (\<forall>a_CONSTANTunde_hunde_a : (((((a_CONSTANTunde_hunde_a) = ([ a_CONSTANTunde_iunde_a \<in> ((intvl (((0)), (a_CONSTANTunde_nunde_a))))  \<mapsto> (cond((((a_CONSTANTunde_iunde_a) = ((0)))), (a_CONSTANTunde_f0unde_a), ((a_CONSTANTunde_Defunde_a_1 ((fapply ((a_CONSTANTunde_hunde_a), ((subint ((a_CONSTANTunde_iunde_a), ((succ[0]))))))), (a_CONSTANTunde_iunde_a))))))]))) \<Rightarrow> (((a_CONSTANTunde_hunde_a) = (a_CONSTANTunde_funde_a))))))))))))))"
shows "((TRUE) & (\<forall> a_CONSTANTunde_nunde_a \<in> (Nat) : (\<forall>a_CONSTANTunde_funde_a : (\<forall>a_CONSTANTunde_f0unde_a : (((((a_CONSTANTunde_funde_a) = (Choice(%a_CONSTANTunde_gunde_a. (((a_CONSTANTunde_gunde_a) = ([ a_CONSTANTunde_iunde_a \<in> ((intvl (((0)), (a_CONSTANTunde_nunde_a))))  \<mapsto> (cond((((a_CONSTANTunde_iunde_a) = ((0)))), (a_CONSTANTunde_f0unde_a), ((a_CONSTANTunde_Defunde_a ((fapply ((a_CONSTANTunde_gunde_a), ((subint ((a_CONSTANTunde_iunde_a), ((succ[0]))))))), (a_CONSTANTunde_iunde_a))))))]))))))) \<Rightarrow> ((((a_CONSTANTunde_funde_a) = ([ a_CONSTANTunde_iunde_a \<in> ((intvl (((0)), (a_CONSTANTunde_nunde_a))))  \<mapsto> (cond((((a_CONSTANTunde_iunde_a) = ((0)))), (a_CONSTANTunde_f0unde_a), ((a_CONSTANTunde_Defunde_a ((fapply ((a_CONSTANTunde_funde_a), ((subint ((a_CONSTANTunde_iunde_a), ((succ[0]))))))), (a_CONSTANTunde_iunde_a))))))]))) & (\<forall>a_CONSTANTunde_hunde_a : (((((a_CONSTANTunde_hunde_a) = ([ a_CONSTANTunde_iunde_a \<in> ((intvl (((0)), (a_CONSTANTunde_nunde_a))))  \<mapsto> (cond((((a_CONSTANTunde_iunde_a) = ((0)))), (a_CONSTANTunde_f0unde_a), ((a_CONSTANTunde_Defunde_a ((fapply ((a_CONSTANTunde_hunde_a), ((subint ((a_CONSTANTunde_iunde_a), ((succ[0]))))))), (a_CONSTANTunde_iunde_a))))))]))) \<Rightarrow> (((a_CONSTANTunde_hunde_a) = (a_CONSTANTunde_funde_a)))))))))))))"(is "PROP ?ob'3")
proof -
show "PROP ?ob'3"
using assms by auto
qed
end
