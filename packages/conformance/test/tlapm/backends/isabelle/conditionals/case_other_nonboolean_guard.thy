(*---
description: >-
  simp unfolds a CASE with the Case_simps into a CHOOSE but cannot finish when the guard p is a
  constant not known to be Boolean, since ~p only gives boolify(p) = FALSE.
ref: isabelle/CaseExpressions.thy
outcome: unknown
---*)
(* automatically generated -- do not edit manually *)
theory case_other_nonboolean_guard imports Constant Zenon begin
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
lemma ob'1: (* 86cd33e7b853b83a3b12a8438ff15866 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_punde_a
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "((((~ (a_CONSTANTunde_punde_a))) \<Rightarrow> (((CaseOther(<<(a_CONSTANTunde_punde_a)>>,<<(a_CONSTANTunde_xunde_a)>>,(a_CONSTANTunde_yunde_a))) = (a_CONSTANTunde_yunde_a)))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by simp
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
