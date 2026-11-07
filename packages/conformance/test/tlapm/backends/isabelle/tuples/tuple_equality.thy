(*---
description: auto proves equal pairs have equal second components.
ref: isabelle/Tuples.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory tuple_equality imports Constant Zenon begin
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
lemma ob'1: (* d3f2b3ae639ed675b6ddb558c868e9e5 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
fixes a_CONSTANTunde_zunde_a
fixes a_CONSTANTunde_wunde_a
shows "(((((<<(a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a)>>) = (<<(a_CONSTANTunde_zunde_a), (a_CONSTANTunde_wunde_a)>>))) \<Rightarrow> (((a_CONSTANTunde_yunde_a) = (a_CONSTANTunde_wunde_a)))))"(is "PROP ?ob'1")
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
