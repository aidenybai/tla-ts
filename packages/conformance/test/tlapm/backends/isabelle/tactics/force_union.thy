(*---
description: BY Force runs force on a goal about UNION.
ref: library/TLAPS.tla#Force
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory force_union imports Constant Zenon begin
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
lemma ob'1: (* a26f6236a525f4fdd4f214daa3c5a6c1 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(((((((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))) \<and> (((a_CONSTANTunde_Sunde_a) \<in> (a_CONSTANTunde_Tunde_a))))) \<Rightarrow> (((a_CONSTANTunde_xunde_a) \<in> ((UNION (a_CONSTANTunde_Tunde_a)))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by force
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
