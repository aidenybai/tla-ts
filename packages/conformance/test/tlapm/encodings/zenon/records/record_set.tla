(*---
description: A record set is TLA.recordset.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE record_set ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW v \in S PROVE [a |-> v] \in [a : S]
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

    File "./record_set.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory record_set imports Constant Zenon begin
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
    fixes a_CONSTANTunde_vunde_a
    assumes a_CONSTANTunde_vunde_a_in : "(a_CONSTANTunde_vunde_a \<in> (a_CONSTANTunde_Sunde_a))"
    shows "(((((''a'' :> (a_CONSTANTunde_vunde_a)))) \<in> ([''a'' : (a_CONSTANTunde_Sunde_a)])))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_vunde_a_in" (TLA.in a_CONSTANTunde_vunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.in (TLA.record "a" a_CONSTANTunde_vunde_a)
    (TLA.recordset "a" a_CONSTANTunde_Sunde_a))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_vunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_ha")
     using a_CONSTANTunde_vunde_a_in by blast
     assume z_Hb:"(~((''a'' :> (a_CONSTANTunde_vunde_a)) \\in [''a'' : (a_CONSTANTunde_Sunde_a)]))" (is "~?z_he")
     let ?z_hf = "(''a'' :> (a_CONSTANTunde_vunde_a))"
     have z_Hi: "isAFcn(?z_hf)" (is "?z_hi")
     proof (rule zenon_nnpp)
      assume z_Hj: "(~?z_hi)"
      show FALSE using z_Hj by auto
     qed
     have z_Hk: "(DOMAIN(?z_hf)={''a''})" (is "?z_hl=?z_hm")
     proof (rule zenon_nnpp)
      assume z_Hn: "(?z_hl~=?z_hm)"
      have z_Hk: "(?z_hl=?z_hm)"
      by auto
      have z_Ho: "(?z_hm~=?z_hm)"
      by (rule subst [where P="(\<lambda>zenon_Vn. (zenon_Vn~=?z_hm))", OF z_Hk z_Hn])
      show FALSE
      by (rule zenon_noteq [OF z_Ho])
     qed
     have z_Hs: "((?z_hf[''a'']) \\in a_CONSTANTunde_Sunde_a)" (is "?z_hs")
     proof (rule zenon_nnpp)
      assume z_Hu: "(~?z_hs)"
      have z_Hv: "((''a'' \\in ?z_hl)&((?z_hf[''a''])=a_CONSTANTunde_vunde_a))" (is "?z_hw&?z_hx")
      by ((rule zenon_recfield_1)+, rule zenon_recfield_2b)
      have z_Hx: "?z_hx" (is "?z_ht=_")
      by (rule conjD2 [OF z_Hv])
      have z_Hy: "(~?z_ha)"
      by (rule subst [where P="(\<lambda>zenon_Vj. (~(zenon_Vj \\in a_CONSTANTunde_Sunde_a)))", OF z_Hx z_Hu])
      show FALSE
      by (rule notE [OF z_Hy z_Ha])
     qed
     show FALSE by (rule notE [OF z_Hb],
                    rule zenon_inrecordsetI1 [OF z_Hi z_Hk z_Hs ])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_vunde_a_in" (TLA.in a_CONSTANTunde_vunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.in (TLA.record "a" a_CONSTANTunde_vunde_a)
    (TLA.recordset "a" a_CONSTANTunde_Sunde_a))
---*)
