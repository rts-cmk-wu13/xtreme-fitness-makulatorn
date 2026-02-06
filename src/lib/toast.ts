import * as R from 'ramda';

export const showToast = (message: any, isError = false) => {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');

    if (!toast || !toastMsg) {
        console.warn("Toast elements missing from DOM");
        return;
    }

    toastMsg.textContent = message;
    
    toast.className = `toast-visible ${isError ? 'error' : 'success'}`;
    
    setTimeout(() => {
        toast.className = 'toast-hidden';
    }, 4000);
};

export const handleToastResponse = (successMsg: string) => (res: any) => {
    const isSuccess = R.propEq(true, 'success', res);
    const msg = isSuccess 
        ? R.propOr(successMsg, 'message', res)
        : R.propOr('Der opstod en fejl', 'message', res);
    
    showToast(msg, !isSuccess);
    return isSuccess;
};