(*---
description: DOMAIN is TLA.DOMAIN.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE domain ----
EXTENDS TLAPS
THEOREM ASSUME NEW S PROVE DOMAIN [x \in S |-> x] = S
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

    File "./domain.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory domain imports Constant Zenon begin
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
    shows "((((DOMAIN ([ a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> (a_CONSTANTunde_xunde_a)]))) = (a_CONSTANTunde_Sunde_a)))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (= (TLA.DOMAIN (TLA.Fcn a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) a_CONSTANTunde_xunde_a)))
    a_CONSTANTunde_Sunde_a)
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(DOMAIN(Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_xunde_a)))~=a_CONSTANTunde_Sunde_a)" (is "?z_hb~=_")
     have z_Hg: "(a_CONSTANTunde_Sunde_a~=a_CONSTANTunde_Sunde_a)"
     by (rule zenon_domain_fcn_0 [of "(\<lambda>zenon_Vf. (zenon_Vf~=a_CONSTANTunde_Sunde_a))" "a_CONSTANTunde_Sunde_a" "(\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_xunde_a)", OF z_Ha])
     show FALSE
     by (rule zenon_noteq [OF z_Hg])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (= (TLA.DOMAIN (TLA.Fcn a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) a_CONSTANTunde_xunde_a)))
    a_CONSTANTunde_Sunde_a)
---*)
