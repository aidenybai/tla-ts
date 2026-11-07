(*---
description: Isabelle checks the Zenon proof of [a |-> x, b |-> y].b = y.
ref: isabelle/Zenon.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory record_access imports Constant Zenon begin
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

lemma ob'1:
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "(((fapply ((((''a'' :> (a_CONSTANTunde_xunde_a)) @@ (''b'' :> (a_CONSTANTunde_yunde_a)))), (''b''))) = (a_CONSTANTunde_yunde_a)))"(is "PROP ?ob'1")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
show "PROP ?ob'1"

(* BEGIN ZENON INPUT
;; obligation #1
$goal (= (TLA.fapply (TLA.record "a" a_CONSTANTunde_xunde_a "b" a_CONSTANTunde_yunde_a) "b")
a_CONSTANTunde_yunde_a)
END ZENON  INPUT *)
(* PROOF-FOUND *)
(* BEGIN-PROOF *)
proof (rule zenon_nnpp)
 assume z_Ha:"(((''a'' :> (a_CONSTANTunde_xunde_a) @@ ''b'' :> (a_CONSTANTunde_yunde_a))[''b''])~=a_CONSTANTunde_yunde_a)" (is "?z_hb~=_")
 have z_Hh: "((''b'' \\in DOMAIN((''a'' :> (a_CONSTANTunde_xunde_a) @@ ''b'' :> (a_CONSTANTunde_yunde_a))))&(?z_hb=a_CONSTANTunde_yunde_a))" (is "?z_hi&?z_hk")
 by (rule zenon_recfield_2, ((rule zenon_recfield_3)+)?, rule zenon_recfield_3b, auto)
 have z_Hk: "?z_hk"
 by (rule conjD2 [OF z_Hh])
 have z_Hl: "(a_CONSTANTunde_yunde_a~=a_CONSTANTunde_yunde_a)"
 by (rule subst [where P="(\<lambda>zenon_Vf. (zenon_Vf~=a_CONSTANTunde_yunde_a))", OF z_Hk z_Ha])
 show FALSE
 by (rule zenon_noteq [OF z_Hl])
qed
(* END-PROOF *)
ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
