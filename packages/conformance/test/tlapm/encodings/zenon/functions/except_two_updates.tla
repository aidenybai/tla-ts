(*---
description: An EXCEPT with two updates is split into nested single updates before Zenon sees it.
ref: src/expr/e_elab.ml#normalize
mode: encoding
outcome: proved
---*)
---- MODULE except_two_updates ----
EXTENDS TLAPS
THEOREM ASSUME NEW f, NEW a, NEW b PROVE [f EXCEPT ![a] = 1, ![b] = 2] = [[f EXCEPT ![a] = 1] EXCEPT ![b] = 2]
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

    File "./except_two_updates.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory except_two_updates imports Constant Zenon begin
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
    fixes a_CONSTANTunde_funde_a
    fixes a_CONSTANTunde_aunde_a
    fixes a_CONSTANTunde_bunde_a
    shows "((([([(a_CONSTANTunde_funde_a) EXCEPT ![(a_CONSTANTunde_aunde_a)] = ((succ[0]))]) EXCEPT ![(a_CONSTANTunde_bunde_a)] = ((succ[succ[0]]))]) = ([([(a_CONSTANTunde_funde_a) EXCEPT ![(a_CONSTANTunde_aunde_a)] = ((succ[0]))]) EXCEPT ![(a_CONSTANTunde_bunde_a)] = ((succ[succ[0]]))])))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (= (TLA.except (TLA.except a_CONSTANTunde_funde_a a_CONSTANTunde_aunde_a (TLA.fapply TLA.Succ 0)) a_CONSTANTunde_bunde_a (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ 0)))
    (TLA.except (TLA.except a_CONSTANTunde_funde_a a_CONSTANTunde_aunde_a (TLA.fapply TLA.Succ 0)) a_CONSTANTunde_bunde_a (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ 0))))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(except(except(a_CONSTANTunde_funde_a, a_CONSTANTunde_aunde_a, 1), a_CONSTANTunde_bunde_a, 2)~=except(except(a_CONSTANTunde_funde_a, a_CONSTANTunde_aunde_a, 1), a_CONSTANTunde_bunde_a, 2))" (is "?z_hb~=_")
     show FALSE
     by (rule zenon_noteq [OF z_Ha])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (= (TLA.except (TLA.except a_CONSTANTunde_funde_a a_CONSTANTunde_aunde_a (TLA.fapply TLA.Succ 0)) a_CONSTANTunde_bunde_a (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ 0)))
    (TLA.except (TLA.except a_CONSTANTunde_funde_a a_CONSTANTunde_aunde_a (TLA.fapply TLA.Succ 0)) a_CONSTANTunde_bunde_a (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ 0))))
---*)
