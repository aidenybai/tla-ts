(*---
description: +, *, \div and % are arith.add, arith.mul, arith.euclidiv and arith.mod, and a - b is a + (-b).
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE operators ----
EXTENDS Integers, TLAPS
THEOREM ASSUME NEW a, NEW b PROVE (a + b) * (a - b) = ((a + b) * (a - b)) /\ a \div b = a \div b /\ a % b = a % b
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
    fixes a_CONSTANTunde_aunde_a
    fixes a_CONSTANTunde_bunde_a
    shows "((((((((mult (((addint ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a)))), ((subint ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a))))))) = ((mult (((addint ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a)))), ((subint ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a))))))))) \<and> ((((isa_bksl_diva ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a)))) = ((isa_bksl_diva ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a)))))))) \<and> ((((isa_perc_a ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a)))) = ((isa_perc_a ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a))))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (/\ (/\ (= (arith.mul (arith.add a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a) (arith.add a_CONSTANTunde_aunde_a
    (arith.minus a_CONSTANTunde_bunde_a)))
    (arith.mul (arith.add a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (arith.add a_CONSTANTunde_aunde_a (arith.minus a_CONSTANTunde_bunde_a))))
    (= (arith.euclidiv a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (arith.euclidiv a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)))
    (= (arith.mod a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (arith.mod a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~(((((a_CONSTANTunde_aunde_a + a_CONSTANTunde_bunde_a) * (a_CONSTANTunde_aunde_a +  -.(a_CONSTANTunde_bunde_a)))=((a_CONSTANTunde_aunde_a + a_CONSTANTunde_bunde_a) * (a_CONSTANTunde_aunde_a +  -.(a_CONSTANTunde_bunde_a))))&(isa'div(a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a)=isa'div(a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a)))&(isa'pc(a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a)=isa'pc(a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a))))" (is "~(?z_hc&?z_hm)")
     show FALSE
     proof (rule zenon_notand [OF z_Ha])
      assume z_Ho:"(~?z_hc)" (is "~(?z_hd&?z_hk)")
      show FALSE
      proof (rule zenon_notand [OF z_Ho])
       assume z_Hp:"(((a_CONSTANTunde_aunde_a + a_CONSTANTunde_bunde_a) * (a_CONSTANTunde_aunde_a +  -.(a_CONSTANTunde_bunde_a)))~=((a_CONSTANTunde_aunde_a + a_CONSTANTunde_bunde_a) * (a_CONSTANTunde_aunde_a +  -.(a_CONSTANTunde_bunde_a))))" (is "?z_he~=_")
       show FALSE
       by (rule zenon_noteq [OF z_Hp])
      next
       assume z_Hq:"(isa'div(a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a)~=isa'div(a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a))" (is "?z_hl~=_")
       show FALSE
       by (rule zenon_noteq [OF z_Hq])
      qed
     next
      assume z_Hr:"(isa'pc(a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a)~=isa'pc(a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a))" (is "?z_hn~=_")
      show FALSE
      by (rule zenon_noteq [OF z_Hr])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (/\ (/\ (= (arith.mul (arith.add a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a) (arith.add a_CONSTANTunde_aunde_a
    (arith.minus a_CONSTANTunde_bunde_a)))
    (arith.mul (arith.add a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (arith.add a_CONSTANTunde_aunde_a (arith.minus a_CONSTANTunde_bunde_a))))
    (= (arith.euclidiv a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (arith.euclidiv a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)))
    (= (arith.mod a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (arith.mod a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a)))
---*)
