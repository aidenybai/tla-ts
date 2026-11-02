(* automatically generated -- do not edit manually *)
theory Failures imports Constant Zenon begin
ML_command \<open> writeln ("*** TLAPS PARSED\n"); \<close>
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

lemma ob'10:
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Alphaunde_a
fixes a_CONSTANTunde_Betaunde_a
fixes a_CONSTANTunde_Gammaunde_a
shows "(TRUE)"(is "PROP ?ob'10")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 10"; \<close>
show "PROP ?ob'10"
using assms by auto
ML_command \<open> writeln "*** TLAPS EXIT 10"; \<close> qed
end
