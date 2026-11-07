(*---
description: BY IsaM("fast") instantiates a universal hypothesis.
ref: src/backend/isabelle.ml#thy_temp
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory fast_forall_instance imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./G.tla", line 5, characters 3-4 *)
lemma ob'1: (* 61bf5409bca0644ef463e93af7b864c5 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Punde_a
shows "(((\<forall>a_CONSTANTunde_aunde_a : ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_aunde_a))))) \<Rightarrow> ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_xunde_a))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by fast
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
