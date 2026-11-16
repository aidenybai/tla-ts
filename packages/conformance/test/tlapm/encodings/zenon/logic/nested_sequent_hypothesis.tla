(*---
description: A hypothesis that is itself an ASSUME/PROVE with a bounded NEW constant is written as a bounded TLA.bAll over the set.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE nested_sequent_hypothesis ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW P(_), ASSUME NEW x \in S PROVE P(x) PROVE \A y \in S : P(y)
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

    File "./nested_sequent_hypothesis.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory nested_sequent_hypothesis imports Constant Zenon begin
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
    fixes a_CONSTANTunde_Sunde_a
    fixes a_CONSTANTunde_Punde_a
    assumes v'6: "((\<And> a_CONSTANTunde_xunde_a :: c. a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a) \<Longrightarrow> ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_xunde_a))))))"
    shows "(\<forall> a_CONSTANTunde_yunde_a \<in> (a_CONSTANTunde_Sunde_a) : ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_yunde_a)))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "v'6" (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (a_CONSTANTunde_Punde_a a_CONSTANTunde_xunde_a)))
    $goal (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_yunde_a) (a_CONSTANTunde_Punde_a a_CONSTANTunde_yunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"bAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_Punde_a(a_CONSTANTunde_xunde_a)))" (is "?z_ha")
     using v'6 by blast
     assume z_Hb:"(~?z_ha)"
     show FALSE
     by (rule notE [OF z_Hb z_Ha])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "v'6" (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (a_CONSTANTunde_Punde_a a_CONSTANTunde_xunde_a)))
    $goal (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_yunde_a) (a_CONSTANTunde_Punde_a a_CONSTANTunde_yunde_a)))
---*)
