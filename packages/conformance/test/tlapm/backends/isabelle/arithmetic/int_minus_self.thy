(*---
description: simp proves x - x = 0 for x \in Int.
ref: isabelle/IntegerArithmetic.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory int_minus_self imports Constant Zenon begin
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
lemma ob'1: (* 1349d59acb8480da7f7fdb69fec52bb3 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
shows "(((((a_CONSTANTunde_xunde_a) \<in> (Int))) \<Rightarrow> ((((subint ((a_CONSTANTunde_xunde_a), (a_CONSTANTunde_xunde_a)))) = ((0))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by simp
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
