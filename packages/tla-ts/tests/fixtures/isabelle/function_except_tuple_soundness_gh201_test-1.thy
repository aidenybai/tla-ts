(* automatically generated -- do not edit manually *)
theory tlapm_4c2fd3 imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./function_except_tuple_soundness_gh201_test.tla", line 8, characters 11-12 *)
lemma ob'1: (* 15f83b52bf9064cb17e15b76b240e3d1 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
assumes v'5: "((([ a_CONSTANTunde_iunde_a \<in> (Nat)  \<mapsto> (a_CONSTANTunde_iunde_a)]) = ([([ a_CONSTANTunde_iunde_a \<in> (Nat)  \<mapsto> (a_CONSTANTunde_iunde_a)]) EXCEPT ![((0))] = (<<((0))>>)])))"
shows "(FALSE)"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
using assms by auto
qed
end
