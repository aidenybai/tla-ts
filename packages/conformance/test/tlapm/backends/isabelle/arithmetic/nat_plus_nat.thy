(*---
description: auto proves the sum of two naturals is natural.
ref: isabelle/IntegerArithmetic.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory nat_plus_nat imports Constant Zenon begin
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
lemma ob'1: (* 0d81895ddb6f2ebc470601d13f2b140b *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "(((((((a_CONSTANTunde_xunde_a) \<in> (Nat))) \<and> (((a_CONSTANTunde_yunde_a) \<in> (Nat))))) \<Rightarrow> ((((addint ((a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a)))) \<in> (Nat)))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by auto
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
