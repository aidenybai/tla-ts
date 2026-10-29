(* automatically generated -- do not edit manually *)
theory tlapm_a95d87 imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./predarg_test.tla", line 18, characters 5-6 *)
lemma ob'2: (* ab06157a1a1f03144f2b46b1cd4300f5 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
(* usable definition CONSTANT_F_ suppressed *)
fixes a_CONSTANTunde_xunde_a
assumes v'7: "((\<And> a_CONSTANTunde_Punde_a :: c => c. (\<And> a_CONSTANTunde_xunde_a_1 :: c. (((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_xunde_a_1)))) \<Longrightarrow> ((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_Punde_a), (a_CONSTANTunde_xunde_a_1))))))))"
shows "((a_CONSTANTunde_Funde_a ((\<lambda> a_Unknownunde_yunde_a . (((a_Unknownunde_yunde_a) = (a_Unknownunde_yunde_a)))), (a_CONSTANTunde_xunde_a))))"(is "PROP ?ob'2")
proof -
show "PROP ?ob'2"
using assms by auto
qed
end
