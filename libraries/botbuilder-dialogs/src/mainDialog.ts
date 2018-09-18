/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StatePropertyAccessor, TurnContext } from 'botbuilder-core';
import { ComponentDialog } from './componentDialog';
import { DialogTurnResult, DialogTurnStatus } from './dialog';
import { DialogState, DialogContext } from './dialogContext';
import { DialogSet } from './dialogSet';


const MAIN_DIALOG_ID: string = 'main';

/**
 * Base class for a bots main dialog.
 * 
 * @remarks
 * This class extends `ComponentDialog` and adds a `run()` method to simplify dispatching an 
 * incoming activity to the bots dialog system. Developers should extend this class and then add
 * all of their bots child dialogs using the `addDialog()` method.
 */
export abstract class MainDialog extends ComponentDialog {
    private readonly mainDialogSet: DialogSet;

    /**
     * State property used to persist the bots dialog stack.
     */
    protected readonly dialogState: StatePropertyAccessor<DialogState>;

    /**
     * Creates a new MainDialog instance.
     * @param dialogState State property used to persist the bots dialog stack.
     * @param dialogId (Optional) id to assign to the main dialog on the stack. Defaults to a value of 'main'.
     */
    constructor(dialogState: StatePropertyAccessor<DialogState>, dialogId = MAIN_DIALOG_ID) {
        super(dialogId);
        if (!dialogState) {
            throw new Error('dialogState is null');
        }
        this.mainDialogSet = new DialogSet(dialogState).add(this);
        this.dialogState = dialogState;
    }

    /**
     * Method called to route the received activity.
     * @param dc The dialog context for the current turn of conversation.
     */
    public abstract onRunTurn(dc: DialogContext): Promise<DialogTurnResult>;


    /**
     * Processes an incoming activity.
     * 
     * @remarks
     * The activity will simply be dispatched to the main dialog for processing. If current dialog 
     * stack doesn't contain a main dialog, a new instance of the main dialog will be started. 
     * @param context Turn context containing the activity that was received.
     */
    public async run(context: TurnContext): Promise<DialogTurnResult> {
        if (!context) {
            throw new Error('MainDialog.run(): context is undefined or null');
        }

        // Create a dialog context and try to continue running the current dialog

        const dc = await this.mainDialogSet.createContext(context);
        let result = await dc.continueDialog();


        // Start the main dialog if there wasn't a running one
        if (result.status === DialogTurnStatus.empty) {
            result = await dc.beginDialog(this.id);
        }
        return result;
    }

    protected onBeginDialog(innerDC: DialogContext, options?: any): Promise<DialogTurnResult> {
        // Just call onContinueDialog()
        // - We're overriding the components built in logic that wants to start the initial dialog.
        //   We want the bots onRunTurn() implementation to always decide which dialog (if any) 
        //   gets started.
        return this.onContinueDialog(innerDC);
    }

    protected onContinueDialog(innerDC: DialogContext): Promise<DialogTurnResult> {
        // Just call onRunTurn()
        // - We're overriding the components built in logic that calls innerDC.continueDialog().
        //   We want the bots onRunTurn() implementation to decide what should happen for a turn.
        return this.onRunTurn(innerDC);
    }
}