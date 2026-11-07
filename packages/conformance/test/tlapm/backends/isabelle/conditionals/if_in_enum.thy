(*---
description: auto proves (IF p THEN x ELSE y) \in {x, y} by a case split.
ref: isabelle/PredicateLogic.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory if_in_enum imports Constant Zenon begin
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
lemma ob'1: (* a787801b994c03e9ffae64e3e0c5803f *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_punde_a
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "(((cond((a_CONSTANTunde_punde_a), (a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a))) \<in> ({(a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a)})))"(is "PROP ?ob'1")
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
