(*---
description: IF is cond, and a CASE with OTHER is CaseOther over a tuple of the conditions, a tuple of the values and the OTHER value.
ref: src/backend/isabelle.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE conditionals ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW a, NEW b PROVE (IF P THEN a ELSE a) = a /\ (CASE P -> a [] OTHER -> b) = (CASE P -> a [] OTHER -> b)
  BY Isa
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
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./conditionals.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory conditionals imports Constant Zenon begin
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
    fixes a_CONSTANTunde_aunde_a
    fixes a_CONSTANTunde_bunde_a
    shows "(((((cond((a_CONSTANTunde_Punde_a), (a_CONSTANTunde_aunde_a), (a_CONSTANTunde_aunde_a))) = (a_CONSTANTunde_aunde_a))) \<and> (((CaseOther(<<(a_CONSTANTunde_Punde_a)>>,<<(a_CONSTANTunde_aunde_a)>>,(a_CONSTANTunde_bunde_a))) = (CaseOther(<<(a_CONSTANTunde_Punde_a)>>,<<(a_CONSTANTunde_aunde_a)>>,(a_CONSTANTunde_bunde_a)))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"
    using assms by auto
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory tlapm_<id> imports Constant Zenon begin
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    (* Generated from file "./conditionals.tla", line 10, characters 3-4 *)
    lemma ob'1: (* 90a4ca3acfe7c34a6c35261b148cfb7f *)
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_CONSTANTunde_Punde_a
    fixes a_CONSTANTunde_aunde_a
    fixes a_CONSTANTunde_bunde_a
    shows "(((((cond((a_CONSTANTunde_Punde_a), (a_CONSTANTunde_aunde_a), (a_CONSTANTunde_aunde_a))) = (a_CONSTANTunde_aunde_a))) \<and> (((CaseOther(<<(a_CONSTANTunde_Punde_a)>>,<<(a_CONSTANTunde_aunde_a)>>,(a_CONSTANTunde_bunde_a))) = (CaseOther(<<(a_CONSTANTunde_Punde_a)>>,<<(a_CONSTANTunde_aunde_a)>>,(a_CONSTANTunde_bunde_a)))))))"(is "PROP ?ob'1")
    proof -
    show "PROP ?ob'1"
    by auto
    qed
    end
---*)
