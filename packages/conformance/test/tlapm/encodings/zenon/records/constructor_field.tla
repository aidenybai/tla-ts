(*---
description: A record is TLA.record of field names and values, and a field selection applies it to the field's string.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE constructor_field ----
EXTENDS TLAPS
THEOREM ASSUME NEW v PROVE [a |-> v].a = v
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

    File "./constructor_field.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory constructor_field imports Constant Zenon begin
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
    fixes a_CONSTANTunde_vunde_a
    shows "(((fapply ((((''a'' :> (a_CONSTANTunde_vunde_a)))), (''a''))) = (a_CONSTANTunde_vunde_a)))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (= (TLA.fapply (TLA.record "a" a_CONSTANTunde_vunde_a) "a")
    a_CONSTANTunde_vunde_a)
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(((''a'' :> (a_CONSTANTunde_vunde_a))[''a''])~=a_CONSTANTunde_vunde_a)" (is "?z_hb~=_")
     have z_Hf: "((''a'' \\in DOMAIN((''a'' :> (a_CONSTANTunde_vunde_a))))&(?z_hb=a_CONSTANTunde_vunde_a))" (is "?z_hg&?z_hi")
     by ((rule zenon_recfield_1)+, rule zenon_recfield_2b)
     have z_Hi: "?z_hi"
     by (rule conjD2 [OF z_Hf])
     have z_Hj: "(a_CONSTANTunde_vunde_a~=a_CONSTANTunde_vunde_a)"
     by (rule subst [where P="(\<lambda>zenon_Vf. (zenon_Vf~=a_CONSTANTunde_vunde_a))", OF z_Hi z_Ha])
     show FALSE
     by (rule zenon_noteq [OF z_Hj])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (= (TLA.fapply (TLA.record "a" a_CONSTANTunde_vunde_a) "a")
    a_CONSTANTunde_vunde_a)
---*)
