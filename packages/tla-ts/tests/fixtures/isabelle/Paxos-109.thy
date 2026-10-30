(* automatically generated -- do not edit manually *)
theory tlapm_109 imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

lemma ob'109:
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Acceptorsunde_a
fixes a_CONSTANTunde_Valuesunde_a
fixes a_CONSTANTunde_Quorumsunde_a
fixes a_VARIABLEunde_msgsunde_a a_VARIABLEunde_msgsunde_a'
fixes a_VARIABLEunde_maxBalunde_a a_VARIABLEunde_maxBalunde_a'
fixes a_VARIABLEunde_maxVBalunde_a a_VARIABLEunde_maxVBalunde_a'
fixes a_VARIABLEunde_maxValunde_a a_VARIABLEunde_maxValunde_a'
(* usable definition STATE_vars_ suppressed *)
(* usable definition ACTION_Send_ suppressed *)
(* usable definition CONSTANT_None_ suppressed *)
(* usable definition STATE_Init_ suppressed *)
(* usable definition ACTION_Phase1a_ suppressed *)
(* usable definition ACTION_Phase1b_ suppressed *)
(* usable definition ACTION_Phase2a_ suppressed *)
(* usable definition ACTION_Phase2b_ suppressed *)
(* usable definition ACTION_Next_ suppressed *)
(* usable definition TEMPORAL_Spec_ suppressed *)
(* usable definition STATE_VotedForIn_ suppressed *)
(* usable definition STATE_ChosenIn_ suppressed *)
(* usable definition STATE_Chosen_ suppressed *)
(* usable definition STATE_Consistency_ suppressed *)
(* usable definition STATE_WontVoteIn_ suppressed *)
(* usable definition STATE_SafeAt_ suppressed *)
(* usable definition STATE_MsgInv_ suppressed *)
assumes v'37: "((((((((a_VARIABLEunde_msgsunde_a) \<in> ((SUBSET ((((((([''type'' : ({(''1a'')}), ''bal'' : (Nat)]) \<union> ([''type'' : ({(''1b'')}), ''bal'' : (Nat), ''maxVBal'' : (((Nat) \<union> ({((minus (((succ[0])))))}))), ''maxVal'' : (((a_CONSTANTunde_Valuesunde_a) \<union> ({(a_CONSTANTunde_Noneunde_a)}))), ''acc'' : (a_CONSTANTunde_Acceptorsunde_a)]))) \<union> ([''type'' : ({(''2a'')}), ''bal'' : (Nat), ''val'' : (a_CONSTANTunde_Valuesunde_a)]))) \<union> ([''type'' : ({(''2b'')}), ''bal'' : (Nat), ''val'' : (a_CONSTANTunde_Valuesunde_a), ''acc'' : (a_CONSTANTunde_Acceptorsunde_a)]))))))) & (((a_VARIABLEunde_maxVBalunde_a) \<in> ([(a_CONSTANTunde_Acceptorsunde_a) \<rightarrow> (((Nat) \<union> ({((minus (((succ[0])))))})))]))) & (((a_VARIABLEunde_maxBalunde_a) \<in> ([(a_CONSTANTunde_Acceptorsunde_a) \<rightarrow> (((Nat) \<union> ({((minus (((succ[0])))))})))]))) & (((a_VARIABLEunde_maxValunde_a) \<in> ([(a_CONSTANTunde_Acceptorsunde_a) \<rightarrow> (((a_CONSTANTunde_Valuesunde_a) \<union> ({(a_CONSTANTunde_Noneunde_a)})))]))) & (\<forall> a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Acceptorsunde_a) : ((geq ((fapply ((a_VARIABLEunde_maxBalunde_a), (a_CONSTANTunde_aunde_a))), (fapply ((a_VARIABLEunde_maxVBalunde_a), (a_CONSTANTunde_aunde_a)))))))) \<and> (a_STATEunde_MsgInvunde_a))) \<and> (\<forall> a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Acceptorsunde_a) : ((((((fapply ((a_VARIABLEunde_maxValunde_a), (a_CONSTANTunde_aunde_a))) = (a_CONSTANTunde_Noneunde_a))) \<Leftrightarrow> (((fapply ((a_VARIABLEunde_maxVBalunde_a), (a_CONSTANTunde_aunde_a))) = ((minus (((succ[0]))))))))) & ((leq ((fapply ((a_VARIABLEunde_maxVBalunde_a), (a_CONSTANTunde_aunde_a))), (fapply ((a_VARIABLEunde_maxBalunde_a), (a_CONSTANTunde_aunde_a)))))) & ((((geq ((fapply ((a_VARIABLEunde_maxVBalunde_a), (a_CONSTANTunde_aunde_a))), ((0))))) \<Rightarrow> ((a_STATEunde_VotedForInunde_a ((a_CONSTANTunde_aunde_a), (fapply ((a_VARIABLEunde_maxValunde_a), (a_CONSTANTunde_aunde_a))), (fapply ((a_VARIABLEunde_maxVBalunde_a), (a_CONSTANTunde_aunde_a)))))))) & (\<forall> a_CONSTANTunde_cunde_a \<in> (Nat) : ((((greater ((a_CONSTANTunde_cunde_a), (fapply ((a_VARIABLEunde_maxVBalunde_a), (a_CONSTANTunde_aunde_a)))))) \<Rightarrow> ((~ (\<exists> a_CONSTANTunde_vunde_a \<in> (a_CONSTANTunde_Valuesunde_a) : ((a_STATEunde_VotedForInunde_a ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_vunde_a), (a_CONSTANTunde_cunde_a))))))))))))))"
assumes v'38: "(a_ACTIONunde_Nextunde_a)"
fixes a_CONSTANTunde_aunde_a
assumes a_CONSTANTunde_aunde_a_in : "(a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Acceptorsunde_a))"
fixes a_CONSTANTunde_munde_a
assumes a_CONSTANTunde_munde_a_in : "(a_CONSTANTunde_munde_a \<in> (a_VARIABLEunde_msgsunde_a))"
assumes v'58: "(((((a_VARIABLEunde_msgsunde_hash_primea :: c)) \<in> ((SUBSET ((((((([''type'' : ({(''1a'')}), ''bal'' : (Nat)]) \<union> ([''type'' : ({(''1b'')}), ''bal'' : (Nat), ''maxVBal'' : (((Nat) \<union> ({((minus (((succ[0])))))}))), ''maxVal'' : (((a_CONSTANTunde_Valuesunde_a) \<union> ({(a_CONSTANTunde_Noneunde_a)}))), ''acc'' : (a_CONSTANTunde_Acceptorsunde_a)]))) \<union> ([''type'' : ({(''2a'')}), ''bal'' : (Nat), ''val'' : (a_CONSTANTunde_Valuesunde_a)]))) \<union> ([''type'' : ({(''2b'')}), ''bal'' : (Nat), ''val'' : (a_CONSTANTunde_Valuesunde_a), ''acc'' : (a_CONSTANTunde_Acceptorsunde_a)]))))))) & ((((a_VARIABLEunde_maxVBalunde_hash_primea :: c)) \<in> ([(a_CONSTANTunde_Acceptorsunde_a) \<rightarrow> (((Nat) \<union> ({((minus (((succ[0])))))})))]))) & ((((a_VARIABLEunde_maxBalunde_hash_primea :: c)) \<in> ([(a_CONSTANTunde_Acceptorsunde_a) \<rightarrow> (((Nat) \<union> ({((minus (((succ[0])))))})))]))) & ((((a_VARIABLEunde_maxValunde_hash_primea :: c)) \<in> ([(a_CONSTANTunde_Acceptorsunde_a) \<rightarrow> (((a_CONSTANTunde_Valuesunde_a) \<union> ({(a_CONSTANTunde_Noneunde_a)})))]))) & (\<forall> a_CONSTANTunde_aunde_a_1 \<in> (a_CONSTANTunde_Acceptorsunde_a) : ((geq ((fapply (((a_VARIABLEunde_maxBalunde_hash_primea :: c)), (a_CONSTANTunde_aunde_a_1))), (fapply (((a_VARIABLEunde_maxVBalunde_hash_primea :: c)), (a_CONSTANTunde_aunde_a_1))))))))"
assumes v'59: "(((geq ((fapply ((a_CONSTANTunde_munde_a), (''bal''))), (fapply ((a_VARIABLEunde_maxBalunde_a), (a_CONSTANTunde_aunde_a)))))) & ((a_ACTIONunde_Sendunde_a ((((''type'' :> (''2b'')) @@ (''bal'' :> (fapply ((a_CONSTANTunde_munde_a), (''bal'')))) @@ (''val'' :> (fapply ((a_CONSTANTunde_munde_a), (''val'')))) @@ (''acc'' :> (a_CONSTANTunde_aunde_a))))))))"
assumes v'60: "(((fapply ((a_CONSTANTunde_munde_a), (''type''))) = (''2a'')))"
assumes v'61: "((((a_VARIABLEunde_maxVBalunde_hash_primea :: c)) = ([(a_VARIABLEunde_maxVBalunde_a) EXCEPT ![(a_CONSTANTunde_aunde_a)] = (fapply ((a_CONSTANTunde_munde_a), (''bal'')))])))"
assumes v'62: "((((a_VARIABLEunde_maxBalunde_hash_primea :: c)) = ([(a_VARIABLEunde_maxBalunde_a) EXCEPT ![(a_CONSTANTunde_aunde_a)] = (fapply ((a_CONSTANTunde_munde_a), (''bal'')))])))"
assumes v'63: "((((a_VARIABLEunde_maxValunde_hash_primea :: c)) = ([(a_VARIABLEunde_maxValunde_a) EXCEPT ![(a_CONSTANTunde_aunde_a)] = (fapply ((a_CONSTANTunde_munde_a), (''val'')))])))"
assumes v'64: "(((a_CONSTANTunde_Noneunde_a) \<notin> (a_CONSTANTunde_Valuesunde_a)))"
shows "(\<forall> a_CONSTANTunde_accunde_a \<in> (a_CONSTANTunde_Acceptorsunde_a) : ((((((fapply (((a_VARIABLEunde_maxValunde_hash_primea :: c)), (a_CONSTANTunde_accunde_a))) = (a_CONSTANTunde_Noneunde_a))) \<Leftrightarrow> (((fapply (((a_VARIABLEunde_maxVBalunde_hash_primea :: c)), (a_CONSTANTunde_accunde_a))) = ((minus (((succ[0]))))))))) & ((leq ((fapply (((a_VARIABLEunde_maxVBalunde_hash_primea :: c)), (a_CONSTANTunde_accunde_a))), (fapply (((a_VARIABLEunde_maxBalunde_hash_primea :: c)), (a_CONSTANTunde_accunde_a))))))))"(is "PROP ?ob'109")
proof -
show "PROP ?ob'109"
using assms by auto
qed
end
