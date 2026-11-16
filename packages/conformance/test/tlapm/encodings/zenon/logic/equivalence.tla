(*---
description: <=> is written as <=> and => as =>.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE equivalence ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q PROVE (P <=> Q) => (Q <=> P)
  BY Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./equivalence.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory equivalence imports Constant Zenon begin
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
    fixes a_CONSTANTunde_Punde_a
    fixes a_CONSTANTunde_Qunde_a
    shows "(((((a_CONSTANTunde_Punde_a) \<Leftrightarrow> (a_CONSTANTunde_Qunde_a))) \<Rightarrow> (((a_CONSTANTunde_Qunde_a) \<Leftrightarrow> (a_CONSTANTunde_Punde_a)))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (=> (<=> a_CONSTANTunde_Punde_a a_CONSTANTunde_Qunde_a)
    (<=> a_CONSTANTunde_Qunde_a
    a_CONSTANTunde_Punde_a))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~((a_CONSTANTunde_Punde_a<=>a_CONSTANTunde_Qunde_a)=>(a_CONSTANTunde_Qunde_a<=>a_CONSTANTunde_Punde_a)))" (is "~(?z_hc=>?z_hf)")
     have z_Hc: "?z_hc"
     by (rule zenon_notimply_0 [OF z_Ha])
     have z_Hg: "(~?z_hf)"
     by (rule zenon_notimply_1 [OF z_Ha])
     show FALSE
     proof (rule zenon_equiv [OF z_Hc])
      assume z_Hh:"(~a_CONSTANTunde_Punde_a)"
      assume z_Hi:"(~a_CONSTANTunde_Qunde_a)"
      show FALSE
      proof (rule zenon_notequiv [OF z_Hg])
       assume z_Hi:"(~a_CONSTANTunde_Qunde_a)"
       assume z_Hd:"a_CONSTANTunde_Punde_a"
       show FALSE
       by (rule notE [OF z_Hh z_Hd])
      next
       assume z_He:"a_CONSTANTunde_Qunde_a"
       assume z_Hh:"(~a_CONSTANTunde_Punde_a)"
       show FALSE
       by (rule notE [OF z_Hi z_He])
      qed
     next
      assume z_Hd:"a_CONSTANTunde_Punde_a"
      assume z_He:"a_CONSTANTunde_Qunde_a"
      show FALSE
      proof (rule zenon_notequiv [OF z_Hg])
       assume z_Hi:"(~a_CONSTANTunde_Qunde_a)"
       assume z_Hd:"a_CONSTANTunde_Punde_a"
       show FALSE
       by (rule notE [OF z_Hi z_He])
      next
       assume z_He:"a_CONSTANTunde_Qunde_a"
       assume z_Hh:"(~a_CONSTANTunde_Punde_a)"
       show FALSE
       by (rule notE [OF z_Hh z_Hd])
      qed
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (=> (<=> a_CONSTANTunde_Punde_a a_CONSTANTunde_Qunde_a)
    (<=> a_CONSTANTunde_Qunde_a
    a_CONSTANTunde_Punde_a))
---*)
