(*---
description: A record EXCEPT on a field becomes TLA.except at the field's string.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE except_field ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW r \in [a : S], NEW v PROVE [r EXCEPT !.a = v].a = v
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

    File "./except_field.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory except_field imports Constant Zenon begin
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
    fixes a_CONSTANTunde_runde_a
    assumes a_CONSTANTunde_runde_a_in : "(a_CONSTANTunde_runde_a \<in> ([''a'' : (a_CONSTANTunde_Sunde_a)]))"
    fixes a_CONSTANTunde_vunde_a
    shows "(((fapply (([(a_CONSTANTunde_runde_a) EXCEPT ![''a''] = (a_CONSTANTunde_vunde_a)]), (''a''))) = (a_CONSTANTunde_vunde_a)))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_runde_a_in" (TLA.in a_CONSTANTunde_runde_a (TLA.recordset "a" a_CONSTANTunde_Sunde_a))
    $goal (= (TLA.fapply (TLA.except a_CONSTANTunde_runde_a "a" a_CONSTANTunde_vunde_a) "a")
    a_CONSTANTunde_vunde_a)
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_runde_a \\in [''a'' : (a_CONSTANTunde_Sunde_a)])" (is "?z_ha")
     using a_CONSTANTunde_runde_a_in by blast
     assume z_Hb:"((except(a_CONSTANTunde_runde_a, ''a'', a_CONSTANTunde_vunde_a)[''a''])~=a_CONSTANTunde_vunde_a)" (is "?z_hg~=_")
     have z_Hj: "(DOMAIN(a_CONSTANTunde_runde_a)={''a''})" using z_Ha by auto
     let ?z_hm = "<<''a''>>"
     let ?z_hn = "<<a_CONSTANTunde_Sunde_a>>"
     show FALSE
     proof (rule zenon_fapplyexcept [of "(\<lambda>zenon_Vf. (zenon_Vf~=a_CONSTANTunde_vunde_a))" "a_CONSTANTunde_runde_a" "''a''" "a_CONSTANTunde_vunde_a" "''a''", OF z_Hb])
      assume z_Hr:"(''a'' \\in DOMAIN(a_CONSTANTunde_runde_a))" (is "?z_hr")
      assume z_Hs:"(''a''=''a'')" (is "?z_he=_")
      assume z_Ht:"(a_CONSTANTunde_vunde_a~=a_CONSTANTunde_vunde_a)"
      show FALSE
      by (rule zenon_noteq [OF z_Ht])
     next
      assume z_Hr:"(''a'' \\in DOMAIN(a_CONSTANTunde_runde_a))" (is "?z_hr")
      assume z_Hu:"(''a''~=''a'')" (is "?z_he~=_")
      assume z_Hv:"((a_CONSTANTunde_runde_a[?z_he])~=a_CONSTANTunde_vunde_a)" (is "?z_hw~=_")
      show FALSE
      by (rule zenon_noteq [OF z_Hu])
     next
      assume z_Hx:"(~(''a'' \\in DOMAIN(a_CONSTANTunde_runde_a)))" (is "~?z_hr")
      have z_Hy: "(~(''a'' \\in {''a''}))" (is "~?z_hz")
      by (rule subst [where P="(\<lambda>zenon_Vq. (~(''a'' \\in zenon_Vq)))", OF z_Hj z_Hx])
      have z_Hu: "(''a''~=''a'')" (is "?z_he~=_")
      by (rule zenon_notin_addElt_0 [of "?z_he" "?z_he" "{}", OF z_Hy])
      show FALSE
      by (rule zenon_noteq [OF z_Hu])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_runde_a_in" (TLA.in a_CONSTANTunde_runde_a (TLA.recordset "a" a_CONSTANTunde_Sunde_a))
    $goal (= (TLA.fapply (TLA.except a_CONSTANTunde_runde_a "a" a_CONSTANTunde_vunde_a) "a")
    a_CONSTANTunde_vunde_a)
---*)
