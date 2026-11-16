(*---
description: >-
  auto proves the OTHER value of a CASE whose guard z = 1 is false, through the Case_simps of
  CaseExpressions.
ref: isabelle/CaseExpressions.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory case_other imports Constant Zenon begin
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
lemma ob'1: (* 5fbf695e723fab672b547eec4232fb56 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_zunde_a
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "(((((a_CONSTANTunde_zunde_a) \<noteq> ((succ[0])))) \<Rightarrow> (((CaseOther(<<(((a_CONSTANTunde_zunde_a) = ((succ[0]))))>>,<<(a_CONSTANTunde_xunde_a)>>,(a_CONSTANTunde_yunde_a))) = (a_CONSTANTunde_yunde_a)))))"(is "PROP ?ob'1")
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
