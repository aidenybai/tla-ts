(*---
description: Seq, Len, \o, Append, Head, Tail and SubSeq are the TLA. operators of the same names.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE operators ----
EXTENDS Sequences, TLAPS
THEOREM ASSUME NEW S, NEW s \in Seq(S), NEW t, NEW a PROVE Len(s \o t) = Len(s \o t) /\ Append(s, a) = Append(s, a) /\ Head(Tail(s)) = Head(Tail(s)) /\ SubSeq(s, 1, 1) = SubSeq(s, 1, 1)
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

    File "./operators.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory operators imports Constant Zenon begin
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
    fixes a_CONSTANTunde_sunde_a
    assumes a_CONSTANTunde_sunde_a_in : "(a_CONSTANTunde_sunde_a \<in> ((Seq ((a_CONSTANTunde_Sunde_a)))))"
    fixes a_CONSTANTunde_tunde_a
    fixes a_CONSTANTunde_aunde_a
    shows "((((((((((Len (((isa_bksl_circa ((a_CONSTANTunde_sunde_a), (a_CONSTANTunde_tunde_a))))))) = ((Len (((isa_bksl_circa ((a_CONSTANTunde_sunde_a), (a_CONSTANTunde_tunde_a))))))))) \<and> ((((Append ((a_CONSTANTunde_sunde_a), (a_CONSTANTunde_aunde_a)))) = ((Append ((a_CONSTANTunde_sunde_a), (a_CONSTANTunde_aunde_a)))))))) \<and> ((((Head (((Tail ((a_CONSTANTunde_sunde_a))))))) = ((Head (((Tail ((a_CONSTANTunde_sunde_a))))))))))) \<and> ((((SubSeq ((a_CONSTANTunde_sunde_a), ((succ[0])), ((succ[0]))))) = ((SubSeq ((a_CONSTANTunde_sunde_a), ((succ[0])), ((succ[0])))))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_sunde_a_in" (TLA.in a_CONSTANTunde_sunde_a (TLA.Seq a_CONSTANTunde_Sunde_a))
    $goal (/\ (/\ (/\ (= (TLA.Len (TLA.concat a_CONSTANTunde_sunde_a
    a_CONSTANTunde_tunde_a)) (TLA.Len (TLA.concat a_CONSTANTunde_sunde_a
    a_CONSTANTunde_tunde_a))) (= (TLA.Append a_CONSTANTunde_sunde_a
    a_CONSTANTunde_aunde_a) (TLA.Append a_CONSTANTunde_sunde_a
    a_CONSTANTunde_aunde_a))) (= (TLA.Head (TLA.Tail a_CONSTANTunde_sunde_a))
    (TLA.Head (TLA.Tail a_CONSTANTunde_sunde_a))))
    (= (TLA.SubSeq a_CONSTANTunde_sunde_a (TLA.fapply TLA.Succ 0)
    (TLA.fapply TLA.Succ 0)) (TLA.SubSeq a_CONSTANTunde_sunde_a
    (TLA.fapply TLA.Succ 0)
    (TLA.fapply TLA.Succ 0))))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Hb:"(~((((Len((a_CONSTANTunde_sunde_a \\circ a_CONSTANTunde_tunde_a))=Len((a_CONSTANTunde_sunde_a \\circ a_CONSTANTunde_tunde_a)))&(Append(a_CONSTANTunde_sunde_a, a_CONSTANTunde_aunde_a)=Append(a_CONSTANTunde_sunde_a, a_CONSTANTunde_aunde_a)))&(Head(Tail(a_CONSTANTunde_sunde_a))=Head(Tail(a_CONSTANTunde_sunde_a))))&(SubSeq(a_CONSTANTunde_sunde_a, 1, 1)=SubSeq(a_CONSTANTunde_sunde_a, 1, 1))))" (is "~(?z_hd&?z_hq)")
     show FALSE
     proof (rule zenon_notand [OF z_Hb])
      assume z_Ht:"(~?z_hd)" (is "~(?z_he&?z_hn)")
      show FALSE
      proof (rule zenon_notand [OF z_Ht])
       assume z_Hu:"(~?z_he)" (is "~(?z_hf&?z_hk)")
       show FALSE
       proof (rule zenon_notand [OF z_Hu])
        assume z_Hv:"(Len((a_CONSTANTunde_sunde_a \\circ a_CONSTANTunde_tunde_a))~=Len((a_CONSTANTunde_sunde_a \\circ a_CONSTANTunde_tunde_a)))" (is "?z_hg~=_")
        show FALSE
        by (rule zenon_noteq [OF z_Hv])
       next
        assume z_Hw:"(Append(a_CONSTANTunde_sunde_a, a_CONSTANTunde_aunde_a)~=Append(a_CONSTANTunde_sunde_a, a_CONSTANTunde_aunde_a))" (is "?z_hl~=_")
        show FALSE
        by (rule zenon_noteq [OF z_Hw])
       qed
      next
       assume z_Hx:"(Head(Tail(a_CONSTANTunde_sunde_a))~=Head(Tail(a_CONSTANTunde_sunde_a)))" (is "?z_ho~=_")
       show FALSE
       by (rule zenon_noteq [OF z_Hx])
      qed
     next
      assume z_Hy:"(SubSeq(a_CONSTANTunde_sunde_a, 1, 1)~=SubSeq(a_CONSTANTunde_sunde_a, 1, 1))" (is "?z_hr~=_")
      show FALSE
      by (rule zenon_noteq [OF z_Hy])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_sunde_a_in" (TLA.in a_CONSTANTunde_sunde_a (TLA.Seq a_CONSTANTunde_Sunde_a))
    $goal (/\ (/\ (/\ (= (TLA.Len (TLA.concat a_CONSTANTunde_sunde_a
    a_CONSTANTunde_tunde_a)) (TLA.Len (TLA.concat a_CONSTANTunde_sunde_a
    a_CONSTANTunde_tunde_a))) (= (TLA.Append a_CONSTANTunde_sunde_a
    a_CONSTANTunde_aunde_a) (TLA.Append a_CONSTANTunde_sunde_a
    a_CONSTANTunde_aunde_a))) (= (TLA.Head (TLA.Tail a_CONSTANTunde_sunde_a))
    (TLA.Head (TLA.Tail a_CONSTANTunde_sunde_a))))
    (= (TLA.SubSeq a_CONSTANTunde_sunde_a (TLA.fapply TLA.Succ 0)
    (TLA.fapply TLA.Succ 0)) (TLA.SubSeq a_CONSTANTunde_sunde_a
    (TLA.fapply TLA.Succ 0)
    (TLA.fapply TLA.Succ 0))))
---*)
